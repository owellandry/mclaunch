import { backendRequest } from "./backendClient";

export type DiscordLink = {
  id: string;
  accountId: string;
  discordUserId: string;
  username: string;
  globalName: string | null;
  discriminator: string | null;
  avatarUrl: string | null;
  scopes: string;
  createdAt: string;
  updatedAt: string;
};

export type DiscordFriend = {
  id: string;
  username: string;
  globalName: string | null;
  avatarUrl: string | null;
  status: "online" | "idle" | "dnd" | "offline" | "invisible" | "unknown";
  activity: string | null;
  source: "relationships" | "launcher_network";
  isOnline: boolean;
};

export type DiscordOAuthStart = {
  flow: string;
  sessionId: string;
  authorizeUrl: string;
  callbackUrl: string;
  expiresAt: string;
};

export type DiscordOAuthStatus = {
  id: string;
  status: "pending" | "completed" | "error" | "expired";
  expiresAt: string;
  error: string | null;
  link: DiscordLink | null;
};

export type DiscordFriendsPayload = {
  link: DiscordLink;
  friends: DiscordFriend[];
  onlineCount: number;
  source: "relationships" | "launcher_network" | "mixed";
  note: string | null;
};

export type DiscordPublicStatus = {
  configured: boolean;
  botConfigured: boolean;
  clientId: string | null;
  redirectUri: string;
  scopes: string[];
};

const POLL_INTERVAL_MS = 2_000;
const POLL_TIMEOUT_MS = 1000 * 60 * 5;

export const discordApi = {
  getStatus(signal?: AbortSignal): Promise<DiscordPublicStatus> {
    return backendRequest<DiscordPublicStatus>("/api/v1/discord/status", { signal });
  },

  startOAuth(token: string, signal?: AbortSignal): Promise<DiscordOAuthStart> {
    return backendRequest<DiscordOAuthStart>("/api/v1/discord/oauth/start", {
      method: "POST",
      token,
      signal,
    });
  },

  getOAuthStatus(token: string, sessionId: string, signal?: AbortSignal): Promise<DiscordOAuthStatus> {
    return backendRequest<DiscordOAuthStatus>(
      `/api/v1/discord/oauth/status/${encodeURIComponent(sessionId)}`,
      { token, signal },
    );
  },

  getMe(token: string, signal?: AbortSignal): Promise<DiscordLink> {
    return backendRequest<DiscordLink>("/api/v1/discord/me", { token, signal });
  },

  getFriends(token: string, onlineOnly = true, signal?: AbortSignal): Promise<DiscordFriendsPayload> {
    const qs = onlineOnly ? "" : "?online=0";
    return backendRequest<DiscordFriendsPayload>(`/api/v1/discord/friends${qs}`, { token, signal });
  },

  unlink(token: string, signal?: AbortSignal): Promise<{ unlinked: boolean }> {
    return backendRequest<{ unlinked: boolean }>("/api/v1/discord/link", {
      method: "DELETE",
      token,
      signal,
    });
  },

  async waitForOAuth(
    token: string,
    sessionId: string,
    signal?: AbortSignal,
  ): Promise<DiscordOAuthStatus> {
    const startedAt = Date.now();

    while (true) {
      if (signal?.aborted) {
        throw new Error("El flujo de Discord fue cancelado.");
      }

      const status = await this.getOAuthStatus(token, sessionId, signal);
      if (status.status !== "pending") {
        console.info("[discord] OAuth status", {
          sessionId,
          status: status.status,
          hasLink: Boolean(status.link),
          error: status.error,
        });
      }
      if (status.status === "completed") return status;
      if (status.status === "error") {
        throw new Error(status.error || "No se pudo vincular Discord.");
      }
      if (status.status === "expired") {
        throw new Error("La sesión de Discord expiró. Inténtalo de nuevo.");
      }
      if (Date.now() - startedAt > POLL_TIMEOUT_MS) {
        throw new Error(
          "Discord quedó en pending: el callback no llegó al backend. Revisa redirect_uri en Discord y reinicia el launcher.",
        );
      }

      await new Promise((resolve) => window.setTimeout(resolve, POLL_INTERVAL_MS));
    }
  },
};
