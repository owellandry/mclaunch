import crypto from "node:crypto";
import { Auth } from "msmc";
import type { AccountsService, StoredAccount } from "../accounts/accounts.service";
import type { TokenService } from "../../core/security/token-service";
import type { RedisCache } from "../../infrastructure/redis/cache";

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
    private readonly publicBaseUrl: string,
    private readonly accountsService: AccountsService,
    private readonly tokenService: TokenService,
    private readonly cache: RedisCache,
  ) {}

  async start(prompt = "select_account"): Promise<Pick<LoginSession, "id" | "redirectUri" | "authorizeUrl" | "expiresAt">> {
    const id = crypto.randomUUID();
    const redirectUri = `${this.publicBaseUrl}/api/v1/login/callback/${id}`;
    const auth = new Auth(prompt as "login" | "consent" | "select_account" | "none");
    const authorizeUrl = auth.createLink(redirectUri);
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
      const auth = new Auth(session.prompt as "login" | "consent" | "select_account" | "none");
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
}
