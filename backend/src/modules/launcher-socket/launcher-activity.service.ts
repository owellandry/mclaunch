import type { BackendEnv } from "../../config/env";
import type { RedisCache } from "../../infrastructure/redis/cache";

export type LauncherActivityMode = "launcher" | "launching" | "playing";

export type LauncherSocketClientMessage =
  | {
      type: "hello";
      launcherVersion?: string;
      platform?: string;
      arch?: string;
    }
  | {
      type: "activity";
      mode: LauncherActivityMode;
      startedAt?: number;
      username?: string;
      version?: string;
    }
  | {
      type: "ping";
      sentAt?: number;
    };

export type LauncherSocketServerMessage =
  | {
      type: "welcome";
      sessionId: string;
      serverTime: number;
      config: {
        discordClientId: string | null;
      };
    }
  | {
      type: "ack";
      event: "hello" | "activity";
      serverTime: number;
    }
  | {
      type: "pong";
      serverTime: number;
      sentAt?: number;
    }
  | {
      type: "error";
      code: string;
      message: string;
    };

type LauncherSessionState = {
  sessionId: string;
  connectedAt: number;
  lastSeenAt: number;
  disconnectedAt?: number;
  client: {
    launcherVersion?: string;
    platform?: string;
    arch?: string;
  };
  activity: {
    mode: LauncherActivityMode;
    startedAt: number;
    updatedAt: number;
    durationSeconds: number;
    username?: string;
    version?: string;
  };
};

const SESSION_TTL_SECONDS = 60 * 60 * 4;
const LATEST_TTL_SECONDS = 60 * 30;

const buildSessionKey = (sessionId: string): string => `mclaunch:launcher:ws:session:${sessionId}`;
const LATEST_ACTIVITY_KEY = "mclaunch:launcher:ws:latest";

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null;
};

const toFiniteNumber = (value: unknown): number | null => {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
};

export class LauncherActivityService {
  constructor(
    private readonly redis: RedisCache,
    private readonly env: BackendEnv,
  ) {}

  createWelcomeMessage(sessionId: string): LauncherSocketServerMessage {
    return {
      type: "welcome",
      sessionId,
      serverTime: Date.now(),
      config: {
        discordClientId: this.env.discordClientId || null,
      },
    };
  }

  async registerConnection(sessionId: string): Promise<void> {
    const now = Date.now();
    await this.redis.setJson(
      buildSessionKey(sessionId),
      {
        sessionId,
        connectedAt: now,
        lastSeenAt: now,
        client: {},
        activity: {
          mode: "launcher",
          startedAt: now,
          updatedAt: now,
          durationSeconds: 0,
        },
      } satisfies LauncherSessionState,
      SESSION_TTL_SECONDS,
    );
  }

  async handleMessage(sessionId: string, raw: string): Promise<LauncherSocketServerMessage[]> {
    let payload: unknown;

    try {
      payload = JSON.parse(raw);
    } catch {
      return [
        {
          type: "error",
          code: "INVALID_JSON",
          message: "El mensaje recibido no es JSON valido.",
        },
      ];
    }

    if (!isRecord(payload) || typeof payload.type !== "string") {
      return [
        {
          type: "error",
          code: "INVALID_MESSAGE",
          message: "El mensaje recibido no tiene el formato esperado.",
        },
      ];
    }

    switch (payload.type) {
      case "hello":
        await this.handleHello(sessionId, payload as Extract<LauncherSocketClientMessage, { type: "hello" }>);
        return [{ type: "ack", event: "hello", serverTime: Date.now() }];
      case "activity":
        if (!this.isValidActivityMessage(payload)) {
          return [
            {
              type: "error",
              code: "INVALID_ACTIVITY",
              message: "La actividad recibida no es valida.",
            },
          ];
        }
        await this.handleActivity(sessionId, payload);
        return [{ type: "ack", event: "activity", serverTime: Date.now() }];
      case "ping":
        return [{ type: "pong", serverTime: Date.now(), sentAt: toFiniteNumber(payload.sentAt) ?? undefined }];
      default:
        return [
          {
            type: "error",
            code: "UNKNOWN_EVENT",
            message: `No existe un manejador para el evento ${payload.type}.`,
          },
        ];
    }
  }

  async disconnect(sessionId: string): Promise<void> {
    const session = await this.redis.getJson<LauncherSessionState>(buildSessionKey(sessionId));
    if (!session) return;

    const disconnectedAt = Date.now();
    const updated: LauncherSessionState = {
      ...session,
      lastSeenAt: disconnectedAt,
      disconnectedAt,
    };

    await this.redis.setJson(buildSessionKey(sessionId), updated, 60 * 10);
  }

  private async handleHello(
    sessionId: string,
    payload: Extract<LauncherSocketClientMessage, { type: "hello" }>,
  ): Promise<void> {
    const session = await this.getOrCreateSession(sessionId);
    const updated: LauncherSessionState = {
      ...session,
      lastSeenAt: Date.now(),
      client: {
        launcherVersion: payload.launcherVersion?.trim() || session.client.launcherVersion,
        platform: payload.platform?.trim() || session.client.platform,
        arch: payload.arch?.trim() || session.client.arch,
      },
    };

    await this.redis.setJson(buildSessionKey(sessionId), updated, SESSION_TTL_SECONDS);
  }

  private async handleActivity(
    sessionId: string,
    payload: Extract<LauncherSocketClientMessage, { type: "activity" }>,
  ): Promise<void> {
    const session = await this.getOrCreateSession(sessionId);
    const now = Date.now();
    const startedAt = payload.startedAt && payload.startedAt > 0 ? payload.startedAt : now;
    const updated: LauncherSessionState = {
      ...session,
      lastSeenAt: now,
      activity: {
        mode: payload.mode,
        startedAt,
        updatedAt: now,
        durationSeconds: Math.max(0, Math.floor((now - startedAt) / 1000)),
        username: payload.username?.trim() || undefined,
        version: payload.version?.trim() || undefined,
      },
    };

    await Promise.all([
      this.redis.setJson(buildSessionKey(sessionId), updated, SESSION_TTL_SECONDS),
      this.redis.setJson(LATEST_ACTIVITY_KEY, updated, LATEST_TTL_SECONDS),
    ]);
  }

  private async getOrCreateSession(sessionId: string): Promise<LauncherSessionState> {
    const existing = await this.redis.getJson<LauncherSessionState>(buildSessionKey(sessionId));
    if (existing) return existing;

    const now = Date.now();
    const created: LauncherSessionState = {
      sessionId,
      connectedAt: now,
      lastSeenAt: now,
      client: {},
      activity: {
        mode: "launcher",
        startedAt: now,
        updatedAt: now,
        durationSeconds: 0,
      },
    };

    await this.redis.setJson(buildSessionKey(sessionId), created, SESSION_TTL_SECONDS);
    return created;
  }

  private isValidActivityMessage(
    payload: Record<string, unknown>,
  ): payload is Extract<LauncherSocketClientMessage, { type: "activity" }> {
    return payload.mode === "launcher" || payload.mode === "launching" || payload.mode === "playing";
  }
}
