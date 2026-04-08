import crypto from "node:crypto";
import { Auth, lexicon } from "msmc";
import type { AccountsService, StoredAccount } from "../accounts/accounts.service";
import type { TokenService } from "../../core/security/token-service";
import type { RedisCache } from "../../infrastructure/redis/cache";
import type { BackendEnv } from "../../config/env";
import type { LogsService } from "../logs/logs.service";

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

const isResponseLike = (value: unknown): value is { status: number; statusText?: string; text: () => Promise<string> } => {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  return typeof candidate.status === "number" && typeof candidate.text === "function";
};

const resolveResponseDetails = async (response: unknown): Promise<string | null> => {
  if (!isResponseLike(response)) return null;

  const fallback = response.statusText?.trim() ? `${response.status} ${response.statusText.trim()}` : `HTTP ${response.status}`;

  try {
    const rawBody = (await response.text()).trim();
    if (!rawBody) return fallback;

    try {
      const parsed = JSON.parse(rawBody) as Record<string, unknown>;
      const error = typeof parsed.error === "string" ? parsed.error : "";
      const errorDescription =
        typeof parsed.error_description === "string"
          ? parsed.error_description
          : typeof parsed.errorDescription === "string"
            ? parsed.errorDescription
            : "";
      const description = errorDescription || error;
      return description ? `${fallback}: ${description}` : fallback;
    } catch {
      return `${fallback}: ${rawBody}`;
    }
  } catch {
    return fallback;
  }
};

const resolveLoginErrorMessage = async (error: unknown): Promise<string> => {
  if (error instanceof Error && error.message.trim()) return error.message.trim();
  if (typeof error === "string" && error.trim()) return lexicon.wrapError(error).message;

  if (typeof error === "object" && error !== null) {
    const candidate = error as Record<string, unknown>;

    if (typeof candidate.message === "string" && candidate.message.trim()) {
      return candidate.message.trim();
    }

    if (typeof candidate.error === "string" && candidate.error.trim()) {
      return candidate.error.trim();
    }

    if (typeof candidate.ts === "string" && candidate.ts.trim()) {
      const wrapped = lexicon.wrapError(candidate);
      const responseDetails = await resolveResponseDetails(candidate.response);
      return responseDetails ? `${wrapped.message} (${responseDetails})` : wrapped.message;
    }
  }

  return "No fue posible completar el login.";
};

export class LoginService {
  constructor(
    private readonly env: BackendEnv,
    private readonly accountsService: AccountsService,
    private readonly tokenService: TokenService,
    private readonly cache: RedisCache,
    private readonly logsService: LogsService,
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
    this.logsService.info("login", "Sesion de login creada.", {
      sessionId: id,
      prompt,
      redirectUri,
      expiresAt,
    });

    return {
      id,
      redirectUri,
      authorizeUrl,
      expiresAt,
    };
  }

  async getStatus(id: string): Promise<LoginSession | null> {
    const session = await this.cache.getJson<LoginSession>(getSessionKey(id));
    this.logsService.debug("login", "Consulta de estado de login.", {
      sessionId: id,
      found: Boolean(session),
      status: session?.status ?? null,
    });
    return session;
  }

  async complete(id: string, code: string): Promise<LoginSession> {
    this.logsService.info("login", "Intentando completar login OAuth.", {
      sessionId: id,
      codeLength: code.length,
    });

    const session = await this.getStatus(id);
    if (!session) {
      this.logsService.warn("login", "No se encontro la sesion de login al completar OAuth.", {
        sessionId: id,
      });
      throw new Error("Sesion de login no encontrada o expirada.");
    }

    if (session.expiresAt <= Date.now()) {
      const expired: LoginSession = {
        ...session,
        status: "expired",
        error: "La sesion de login expiro.",
      };
      await this.cache.setJson(getSessionKey(id), expired, 60);
      this.logsService.warn("login", "La sesion de login expiro antes de completar OAuth.", {
        sessionId: id,
        expiresAt: session.expiresAt,
      });
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
      this.logsService.info("login", "Login completado correctamente.", {
        sessionId: id,
        accountId: account.id,
        displayName: account.displayName,
        provider: account.provider,
      });
      return completed;
    } catch (error) {
      const errorMessage = await resolveLoginErrorMessage(error);
      console.error("[login] Error completando login Microsoft", {
        sessionId: id,
        redirectUri: session.redirectUri,
        message: errorMessage,
        rawError: error,
      });
      this.logsService.error("login", "Error completando login Microsoft.", {
        sessionId: id,
        redirectUri: session.redirectUri,
        message: errorMessage,
        rawError: error,
      });

      const failed: LoginSession = {
        ...session,
        status: "error",
        error: errorMessage,
      };
      await this.cache.setJson(getSessionKey(id), failed, 60 * 10);
      return failed;
    }
  }

  async completeFromLauncher(
    msmcToken: string,
    mclcAuth: unknown,
    rawProfile: { id?: string; name?: string; skins?: Array<{ state?: string; url?: string }> },
  ): Promise<{ accessToken: string; account: StoredAccount; launcher: { msmcToken: string; mclcAuth: unknown; profile: unknown } }> {
    const account = await this.accountsService.upsertMicrosoftAccount({
      uuid: rawProfile.id || "00000000-0000-0000-0000-000000000000",
      displayName: rawProfile.name || "Player",
      skinUrl: resolveSkinUrl(rawProfile),
      profile: rawProfile as Record<string, unknown>,
    });

    const accessToken = this.tokenService.issue({
      sub: account.id,
      username: account.displayName,
      scopes: ["accounts:read", "downloads:read", "downloads:manage", "hotupdates:read"],
      provider: account.provider,
    });

    this.logsService.info("login", "Login completado desde launcher Electron.", {
      accountId: account.id,
      displayName: account.displayName,
    });

    return { accessToken, account, launcher: { msmcToken, mclcAuth, profile: rawProfile } };
  }

  async fail(id: string, errorMessage: string): Promise<LoginSession | null> {
    const session = await this.getStatus(id);
    if (!session) {
      this.logsService.warn("login", "Se intento marcar como fallida una sesion inexistente.", {
        sessionId: id,
        errorMessage,
      });
      return null;
    }
    const failed: LoginSession = {
      ...session,
      status: "error",
      error: errorMessage,
    };
    await this.cache.setJson(getSessionKey(id), failed, 60 * 10);
    this.logsService.warn("login", "Sesion de login marcada como error.", {
      sessionId: id,
      errorMessage,
    });
    return failed;
  }

  private createAuth(prompt: string): Auth {
    const options: ConstructorParameters<typeof Auth>[0] = {
      client_id: this.env.microsoftClientId,
      redirect: this.env.microsoftRedirectUri,
      prompt: prompt as "login" | "consent" | "select_account" | "none",
    };
    if (this.env.microsoftClientSecret) {
      options.clientSecret = this.env.microsoftClientSecret;
    }
    return new Auth(options);
  }

  private attachState(authorizeUrl: string, state: string): string {
    const url = new URL(authorizeUrl);
    url.searchParams.set("state", state);
    return url.toString();
  }
}
