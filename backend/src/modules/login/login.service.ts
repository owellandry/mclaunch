import crypto from "node:crypto";
import { Auth } from "msmc";
import type { AccountsService, StoredAccount } from "../accounts/accounts.service";
import type { TokenService } from "../../core/security/token-service";
import type { RedisCache } from "../../infrastructure/redis/cache";
import type { BackendEnv } from "../../config/env";

type LoginStatus = "pending" | "completed" | "error" | "expired";

type LoginSession = {
  id: string;
  prompt: string;
  redirectUri: string;
  authorizeUrl: string;
  status: LoginStatus;
  createdAt: number;
  expiresAt: number;
  result?: {
    accessToken: string;
    account: StoredAccount;
    launcher: {
      msmcToken: string;
      mclcAuth: unknown;
      profile: unknown;
    };
  };
  error?: string;
};

const LOGIN_TTL_MS = 1000 * 60 * 10;

const resolveSkinUrl = (profile: { skins?: Array<{ state?: string; url?: string }> } | null | undefined): string | null => {
  if (!profile?.skins?.length) return null;
  const active = profile.skins.find((skin) => skin.state === "ACTIVE" && skin.url?.trim());
  if (active?.url) return active.url;
  const fallback = profile.skins.find((skin) => skin.url?.trim());
  return fallback?.url ?? null;
};

const getSessionKey = (id: string): string => `mclaunch:login:session:${id}`;

export class LoginService {
  constructor(
    private readonly env: BackendEnv,
    private readonly accountsService: AccountsService,
    private readonly tokenService: TokenService,
    private readonly cache: RedisCache,
  ) {}

  async start(prompt = "select_account"): Promise<Pick<LoginSession, "id" | "redirectUri" | "authorizeUrl" | "expiresAt">> {
    if (!this.env.microsoftClientId) {
      throw new Error(
        "El login backend requiere una app propia de Microsoft. Configura MCLAUNCH_MICROSOFT_CLIENT_ID y registra un redirect fijo en MCLAUNCH_MICROSOFT_REDIRECT_URI.",
      );
    }

    const id = crypto.randomUUID();
    const redirectUri = this.env.microsoftRedirectUri;
    const auth = this.createAuth(prompt);
    const authorizeUrl = this.attachState(auth.createLink(redirectUri), id);
    const expiresAt = Date.now() + LOGIN_TTL_MS;

    const session: LoginSession = {
      id,
      prompt,
      redirectUri,
      authorizeUrl,
      status: "pending",
      createdAt: Date.now(),
      expiresAt,
    };

    await this.cache.setJson(getSessionKey(id), session, Math.ceil(LOGIN_TTL_MS / 1000));

    return {
      id,
      redirectUri,
      authorizeUrl,
      expiresAt,
    };
  }

  async getStatus(id: string): Promise<LoginSession | null> {
    return this.cache.getJson<LoginSession>(getSessionKey(id));
  }

  async complete(id: string, code: string): Promise<LoginSession> {
    const session = await this.getStatus(id);
    if (!session) {
      throw new Error("Sesion de login no encontrada o expirada.");
    }

    if (session.expiresAt <= Date.now()) {
      const expired: LoginSession = {
        ...session,
        status: "expired",
        error: "La sesion de login expiro.",
      };
      await this.cache.setJson(getSessionKey(id), expired, 60);
      return expired;
    }

    try {
      const auth = this.createAuth(session.prompt);
      const xbox = await auth.login(code, session.redirectUri);
      const mc = await xbox.getMinecraft();
      const profile = mc.profile as { id?: string; name?: string; skins?: Array<{ state?: string; url?: string }> };
      const account = await this.accountsService.upsertMicrosoftAccount({
        uuid: profile.id || "00000000-0000-0000-0000-000000000000",
        displayName: profile.name || "Player",
        skinUrl: resolveSkinUrl(profile),
        profile: (profile as Record<string, unknown>) ?? {},
      });

      const accessToken = this.tokenService.issue({
        sub: account.id,
        username: account.displayName,
        scopes: ["accounts:read", "downloads:read", "downloads:manage", "hotupdates:read"],
        provider: account.provider,
      });

      const completed: LoginSession = {
        ...session,
        status: "completed",
        result: {
          accessToken,
          account,
          launcher: {
            msmcToken: xbox.save(),
            mclcAuth: mc.mclc(),
            profile: mc.profile,
          },
        },
      };

      await this.cache.setJson(getSessionKey(id), completed, 60 * 30);
      return completed;
    } catch (error) {
      const failed: LoginSession = {
        ...session,
        status: "error",
        error: error instanceof Error ? error.message : "No fue posible completar el login.",
      };
      await this.cache.setJson(getSessionKey(id), failed, 60 * 10);
      return failed;
    }
  }

  async fail(id: string, errorMessage: string): Promise<LoginSession | null> {
    const session = await this.getStatus(id);
    if (!session) return null;
    const failed: LoginSession = {
      ...session,
      status: "error",
      error: errorMessage,
    };
    await this.cache.setJson(getSessionKey(id), failed, 60 * 10);
    return failed;
  }

  private createAuth(prompt: string): Auth {
    return new Auth({
      client_id: this.env.microsoftClientId,
      clientSecret: this.env.microsoftClientSecret || undefined,
      redirect: this.env.microsoftRedirectUri,
      prompt: prompt as "login" | "consent" | "select_account" | "none",
    });
  }

  private attachState(authorizeUrl: string, state: string): string {
    const url = new URL(authorizeUrl);
    url.searchParams.set("state", state);
    return url.toString();
  }
}
