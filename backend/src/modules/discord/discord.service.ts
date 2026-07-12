import crypto from "node:crypto";
import type { BackendEnv } from "../../config/env";
import type { PostgresDatabase } from "../../infrastructure/postgres/database";
import type { RedisCache } from "../../infrastructure/redis/cache";
import type { LogsService } from "../logs/logs.service";
import type { DiscordBotService, DiscordPresenceStatus } from "./discord-bot.service";

const DISCORD_API = "https://discord.com/api/v10";
const OAUTH_TTL_MS = 1000 * 60 * 10;
const SESSION_KEY = (id: string): string => `mclaunch:discord:oauth:${id}`;

type OAuthStatus = "pending" | "completed" | "error" | "expired";

type OAuthSession = {
  id: string;
  accountId: string;
  status: OAuthStatus;
  authorizeUrl: string;
  redirectUri: string;
  createdAt: number;
  expiresAt: number;
  error?: string;
  result?: {
    link: DiscordLinkPublic;
  };
};

type DiscordUser = {
  id: string;
  username: string;
  global_name?: string | null;
  discriminator?: string;
  avatar?: string | null;
};

type DiscordRelationship = {
  id: string;
  type: number;
  user?: DiscordUser;
  nickname?: string | null;
};

type DiscordTokenResponse = {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
};

type DiscordLinkRow = {
  id: string;
  account_id: string;
  discord_user_id: string;
  username: string;
  global_name: string | null;
  discriminator: string | null;
  avatar: string | null;
  access_token: string;
  refresh_token: string | null;
  token_expires_at: Date | null;
  scopes: string;
  metadata: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
};

export type DiscordLinkPublic = {
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
  status: DiscordPresenceStatus;
  activity: string | null;
  source: "relationships" | "launcher_network";
  isOnline: boolean;
};

const mapLink = (row: DiscordLinkRow): DiscordLinkPublic => ({
  id: row.id,
  accountId: row.account_id,
  discordUserId: row.discord_user_id,
  username: row.username,
  globalName: row.global_name,
  discriminator: row.discriminator,
  avatarUrl: buildAvatarUrl(row.discord_user_id, row.avatar, row.discriminator),
  scopes: row.scopes,
  createdAt: row.created_at.toISOString(),
  updatedAt: row.updated_at.toISOString(),
});

const buildAvatarUrl = (
  userId: string,
  avatar: string | null | undefined,
  discriminator?: string | null,
): string | null => {
  if (avatar) {
    const ext = avatar.startsWith("a_") ? "gif" : "png";
    return `https://cdn.discordapp.com/avatars/${userId}/${avatar}.${ext}?size=128`;
  }
  if (discriminator && discriminator !== "0") {
    const index = Number(discriminator) % 5;
    return `https://cdn.discordapp.com/embed/avatars/${index}.png`;
  }
  // New username system default avatar
  try {
    const index = Number((BigInt(userId) >> 22n) % 6n);
    return `https://cdn.discordapp.com/embed/avatars/${index}.png`;
  } catch {
    return null;
  }
};

export class DiscordService {
  constructor(
    private readonly env: BackendEnv,
    private readonly database: PostgresDatabase,
    private readonly cache: RedisCache,
    private readonly bot: DiscordBotService,
    private readonly logsService: LogsService,
  ) {}

  isConfigured(): boolean {
    return Boolean(this.env.discordClientId && this.env.discordClientSecret);
  }

  async startOAuth(accountId: string): Promise<Pick<OAuthSession, "id" | "authorizeUrl" | "redirectUri" | "expiresAt">> {
    if (!this.isConfigured()) {
      throw new Error(
        "Discord OAuth no esta configurado. Define MCLAUNCH_DISCORD_CLIENT_ID y MCLAUNCH_DISCORD_CLIENT_SECRET.",
      );
    }

    const id = crypto.randomUUID();
    const redirectUri = this.env.discordRedirectUri;
    const scopes = this.env.discordScopes.split(/\s+/).filter(Boolean).join(" ");
    const authorizeUrl = new URL("https://discord.com/api/oauth2/authorize");
    authorizeUrl.searchParams.set("client_id", this.env.discordClientId);
    authorizeUrl.searchParams.set("redirect_uri", redirectUri);
    authorizeUrl.searchParams.set("response_type", "code");
    authorizeUrl.searchParams.set("scope", scopes);
    authorizeUrl.searchParams.set("state", id);
    authorizeUrl.searchParams.set("prompt", "consent");

    const session: OAuthSession = {
      id,
      accountId,
      status: "pending",
      authorizeUrl: authorizeUrl.toString(),
      redirectUri,
      createdAt: Date.now(),
      expiresAt: Date.now() + OAUTH_TTL_MS,
    };

    await this.cache.setJson(SESSION_KEY(id), session, Math.ceil(OAUTH_TTL_MS / 1000));
    this.logsService.info("discord", "Sesion OAuth Discord iniciada.", { sessionId: id, accountId });

    return {
      id: session.id,
      authorizeUrl: session.authorizeUrl,
      redirectUri: session.redirectUri,
      expiresAt: session.expiresAt,
    };
  }

  async getOAuthStatus(sessionId: string): Promise<OAuthSession | null> {
    const session = await this.cache.getJson<OAuthSession>(SESSION_KEY(sessionId));
    if (!session) return null;
    if (session.status === "pending" && session.expiresAt <= Date.now()) {
      session.status = "expired";
      session.error = "La sesion OAuth de Discord expiro.";
      await this.cache.setJson(SESSION_KEY(sessionId), session, 60);
    }
    return session;
  }

  async completeOAuth(sessionId: string, code: string): Promise<OAuthSession> {
    const session = await this.getOAuthStatus(sessionId);
    if (!session) {
      this.logsService.error("discord", "completeOAuth: sesion no encontrada en Redis.", { sessionId });
      throw new Error("No se encontro la sesion OAuth de Discord.");
    }
    if (session.status === "expired") {
      return session;
    }
    if (session.status === "completed" && session.result) {
      return session;
    }

    try {
      this.logsService.info("discord", "completeOAuth: intercambiando code…", {
        sessionId,
        accountId: session.accountId,
        redirectUri: session.redirectUri,
      });
      const tokens = await this.exchangeCode(code, session.redirectUri);
      const user = await this.fetchDiscordUser(tokens.access_token);
      const link = await this.upsertLink({
        accountId: session.accountId,
        user,
        tokens,
      });

      session.status = "completed";
      session.result = { link };
      session.error = undefined;
      await this.cache.setJson(SESSION_KEY(sessionId), session, 60 * 5);
      this.logsService.info("discord", "OAuth Discord completado.", {
        sessionId,
        accountId: session.accountId,
        discordUserId: user.id,
      });
      return session;
    } catch (error) {
      session.status = "error";
      session.error = error instanceof Error ? error.message : "No se pudo completar el login de Discord.";
      await this.cache.setJson(SESSION_KEY(sessionId), session, 60 * 5);
      this.logsService.error("discord", "Fallo al completar OAuth Discord.", {
        sessionId,
        message: session.error,
      });
      return session;
    }
  }

  async failOAuth(sessionId: string, message: string): Promise<void> {
    const session = await this.getOAuthStatus(sessionId);
    if (!session) return;
    session.status = "error";
    session.error = message;
    await this.cache.setJson(SESSION_KEY(sessionId), session, 60 * 5);
  }

  async getLinkByAccountId(accountId: string): Promise<DiscordLinkPublic | null> {
    const result = await this.database.query<DiscordLinkRow>(
      `
        select *
        from discord_links
        where account_id = $1
        limit 1
      `,
      [accountId],
    );
    return result.rows[0] ? mapLink(result.rows[0]) : null;
  }

  async unlink(accountId: string): Promise<boolean> {
    const result = await this.database.query(
      `
        delete from discord_links
        where account_id = $1
      `,
      [accountId],
    );
    return (result.rowCount ?? 0) > 0;
  }

  /**
   * Returns Discord friends/online social graph for the linked account.
   * Prefer Discord relationships API when the app has relationships.read.
   * Otherwise falls back to other launcher users with Discord linked + bot presence.
   */
  async listOnlineFriends(accountId: string): Promise<{
    link: DiscordLinkPublic;
    friends: DiscordFriend[];
    source: "relationships" | "launcher_network" | "mixed";
    note: string | null;
  }> {
    const row = await this.getLinkRowByAccountId(accountId);
    if (!row) {
      throw new Error("Esta cuenta no tiene Discord vinculado.");
    }

    const accessToken = await this.ensureFreshAccessToken(row);
    let friends: DiscordFriend[] = [];
    let source: "relationships" | "launcher_network" | "mixed" = "launcher_network";
    let note: string | null = null;

    const scopes = row.scopes.split(/\s+/).filter(Boolean);
    if (scopes.includes("relationships.read")) {
      try {
        const relationships = await this.fetchRelationships(accessToken);
        friends = await this.mapRelationshipsToFriends(relationships);
        source = "relationships";
      } catch (error) {
        note =
          error instanceof Error
            ? `No se pudo leer relationships de Discord (${error.message}). Usando red del launcher.`
            : "No se pudo leer relationships de Discord. Usando red del launcher.";
        friends = await this.listLauncherNetworkFriends(row.discord_user_id);
        source = "launcher_network";
      }
    } else {
      friends = await this.listLauncherNetworkFriends(row.discord_user_id);
      source = "launcher_network";
      note =
        "El scope relationships.read no esta activo. Se muestran jugadores del launcher con Discord vinculado y presencia del bot.";
    }

    const online = friends.filter((friend) => friend.isOnline);

    return {
      link: mapLink(row),
      friends: online,
      source,
      note,
    };
  }

  async listAllFriends(accountId: string): Promise<{
    link: DiscordLinkPublic;
    friends: DiscordFriend[];
    source: "relationships" | "launcher_network" | "mixed";
    note: string | null;
  }> {
    const payload = await this.listOnlineFriends(accountId);
    // listOnlineFriends already filters online; re-fetch full set for this endpoint
    const row = await this.getLinkRowByAccountId(accountId);
    if (!row) throw new Error("Esta cuenta no tiene Discord vinculado.");

    const accessToken = await this.ensureFreshAccessToken(row);
    let friends: DiscordFriend[] = [];
    let source: "relationships" | "launcher_network" | "mixed" = "launcher_network";
    let note: string | null = null;
    const scopes = row.scopes.split(/\s+/).filter(Boolean);

    if (scopes.includes("relationships.read")) {
      try {
        friends = await this.mapRelationshipsToFriends(await this.fetchRelationships(accessToken));
        source = "relationships";
      } catch (error) {
        friends = await this.listLauncherNetworkFriends(row.discord_user_id);
        source = "launcher_network";
        note = error instanceof Error ? error.message : "Fallback a red del launcher.";
      }
    } else {
      friends = await this.listLauncherNetworkFriends(row.discord_user_id);
      note =
        "El scope relationships.read no esta activo. Se muestran jugadores del launcher con Discord vinculado y presencia del bot.";
    }

    return {
      link: mapLink(row),
      friends,
      source,
      note,
    };
  }

  private async listLauncherNetworkFriends(excludeDiscordUserId: string): Promise<DiscordFriend[]> {
    const result = await this.database.query<DiscordLinkRow>(
      `
        select *
        from discord_links
        where discord_user_id <> $1
        order by updated_at desc
        limit 200
      `,
      [excludeDiscordUserId],
    );

    const presenceMap = await this.bot.getPresenceMap(result.rows.map((row) => row.discord_user_id));

    return result.rows.map((row) => {
      const presence = presenceMap.get(row.discord_user_id);
      const status = presence?.status ?? "offline";
      return {
        id: row.discord_user_id,
        username: row.username,
        globalName: row.global_name,
        avatarUrl: buildAvatarUrl(row.discord_user_id, row.avatar, row.discriminator),
        status,
        activity: presence?.activities[0]?.name ?? null,
        source: "launcher_network" as const,
        isOnline: status === "online" || status === "idle" || status === "dnd",
      };
    });
  }

  private async mapRelationshipsToFriends(relationships: DiscordRelationship[]): Promise<DiscordFriend[]> {
    // type 1 = friend
    const friendsOnly = relationships.filter((rel) => rel.type === 1 && rel.user?.id);
    const userIds = friendsOnly.map((rel) => rel.user!.id);
    const presenceMap = await this.bot.getPresenceMap(userIds);

    return friendsOnly.map((rel) => {
      const user = rel.user!;
      const presence = presenceMap.get(user.id);
      const status = presence?.status ?? "offline";
      return {
        id: user.id,
        username: user.username,
        globalName: user.global_name ?? null,
        avatarUrl: buildAvatarUrl(user.id, user.avatar, user.discriminator),
        status,
        activity: presence?.activities[0]?.name ?? null,
        source: "relationships" as const,
        isOnline: status === "online" || status === "idle" || status === "dnd",
      };
    });
  }

  private async getLinkRowByAccountId(accountId: string): Promise<DiscordLinkRow | null> {
    const result = await this.database.query<DiscordLinkRow>(
      `
        select *
        from discord_links
        where account_id = $1
        limit 1
      `,
      [accountId],
    );
    return result.rows[0] ?? null;
  }

  private async upsertLink(input: {
    accountId: string;
    user: DiscordUser;
    tokens: DiscordTokenResponse;
  }): Promise<DiscordLinkPublic> {
    const id = crypto.randomUUID();
    const expiresAt =
      typeof input.tokens.expires_in === "number"
        ? new Date(Date.now() + input.tokens.expires_in * 1000)
        : null;

    // Free unique discord_user_id if previously linked to another account.
    await this.database.query(
      `
        delete from discord_links
        where discord_user_id = $1
          and account_id <> $2
      `,
      [input.user.id, input.accountId],
    );

    const result = await this.database.query<DiscordLinkRow>(
      `
        insert into discord_links (
          id,
          account_id,
          discord_user_id,
          username,
          global_name,
          discriminator,
          avatar,
          access_token,
          refresh_token,
          token_expires_at,
          scopes,
          metadata,
          created_at,
          updated_at
        ) values (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12::jsonb, now(), now()
        )
        on conflict (account_id) do update set
          discord_user_id = excluded.discord_user_id,
          username = excluded.username,
          global_name = excluded.global_name,
          discriminator = excluded.discriminator,
          avatar = excluded.avatar,
          access_token = excluded.access_token,
          refresh_token = excluded.refresh_token,
          token_expires_at = excluded.token_expires_at,
          scopes = excluded.scopes,
          metadata = excluded.metadata,
          updated_at = now()
        returning *
      `,
      [
        id,
        input.accountId,
        input.user.id,
        input.user.username,
        input.user.global_name ?? null,
        input.user.discriminator ?? null,
        input.user.avatar ?? null,
        input.tokens.access_token,
        input.tokens.refresh_token ?? null,
        expiresAt,
        input.tokens.scope ?? this.env.discordScopes,
        JSON.stringify({ provider: "discord" }),
      ],
    );

    return mapLink(result.rows[0]);
  }

  private async exchangeCode(code: string, redirectUri: string): Promise<DiscordTokenResponse> {
    const body = new URLSearchParams({
      client_id: this.env.discordClientId,
      client_secret: this.env.discordClientSecret,
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
    });

    const response = await fetch(`${DISCORD_API}/oauth2/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Discord token exchange failed (${response.status}): ${text}`);
    }

    return (await response.json()) as DiscordTokenResponse;
  }

  private async refreshAccessToken(refreshToken: string): Promise<DiscordTokenResponse> {
    const body = new URLSearchParams({
      client_id: this.env.discordClientId,
      client_secret: this.env.discordClientSecret,
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    });

    const response = await fetch(`${DISCORD_API}/oauth2/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Discord token refresh failed (${response.status}): ${text}`);
    }

    return (await response.json()) as DiscordTokenResponse;
  }

  private async ensureFreshAccessToken(row: DiscordLinkRow): Promise<string> {
    const expiresAt = row.token_expires_at ? new Date(row.token_expires_at).getTime() : 0;
    const stillValid = expiresAt > Date.now() + 60_000;
    if (stillValid) return row.access_token;

    if (!row.refresh_token) {
      return row.access_token;
    }

    const tokens = await this.refreshAccessToken(row.refresh_token);
    const newExpires =
      typeof tokens.expires_in === "number" ? new Date(Date.now() + tokens.expires_in * 1000) : null;

    await this.database.query(
      `
        update discord_links
        set
          access_token = $2,
          refresh_token = coalesce($3, refresh_token),
          token_expires_at = $4,
          scopes = coalesce($5, scopes),
          updated_at = now()
        where id = $1
      `,
      [row.id, tokens.access_token, tokens.refresh_token ?? null, newExpires, tokens.scope ?? null],
    );

    row.access_token = tokens.access_token;
    row.refresh_token = tokens.refresh_token ?? row.refresh_token;
    row.token_expires_at = newExpires;
    return tokens.access_token;
  }

  private async fetchDiscordUser(accessToken: string): Promise<DiscordUser> {
    const response = await fetch(`${DISCORD_API}/users/@me`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Discord /users/@me failed (${response.status}): ${text}`);
    }
    return (await response.json()) as DiscordUser;
  }

  private async fetchRelationships(accessToken: string): Promise<DiscordRelationship[]> {
    const response = await fetch(`${DISCORD_API}/users/@me/relationships`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Discord relationships failed (${response.status}): ${text}`);
    }
    return (await response.json()) as DiscordRelationship[];
  }
}
