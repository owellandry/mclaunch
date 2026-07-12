import type { LogsService } from "../logs/logs.service";
import type { RedisCache } from "../../infrastructure/redis/cache";

export type DiscordPresenceStatus = "online" | "idle" | "dnd" | "offline" | "invisible" | "unknown";

export type DiscordPresenceSnapshot = {
  userId: string;
  status: DiscordPresenceStatus;
  activities: Array<{ name: string; type: number }>;
  updatedAt: number;
};

const PRESENCE_KEY = (userId: string): string => `mclaunch:discord:presence:${userId}`;
const PRESENCE_TTL_SECONDS = 60 * 30;
const GATEWAY_URL = "wss://gateway.discord.gg/?v=10&encoding=json";

/** GUILDS | GUILD_MEMBERS | GUILD_PRESENCES */
const GATEWAY_INTENTS = 1 + 2 + 256;

type GatewayPayload = {
  op: number;
  d?: unknown;
  s?: number | null;
  t?: string | null;
};

/**
 * Lightweight Discord bot gateway client.
 * Caches member presence so the friends API can report who is online.
 * Requires privileged intents (Server Members + Presence) enabled in the Discord portal.
 */
export class DiscordBotService {
  private socket: WebSocket | null = null;
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;
  private sequence: number | null = null;
  private sessionId: string | null = null;
  private resumeUrl: string | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private started = false;

  constructor(
    private readonly botToken: string,
    private readonly cache: RedisCache,
    private readonly logsService: LogsService,
  ) {}

  start(): void {
    if (!this.botToken) {
      this.logsService.warn("discord-bot", "Bot token vacio: presencia Discord desactivada.");
      return;
    }
    if (this.started) return;
    this.started = true;
    this.connect(false);
  }

  stop(): void {
    this.started = false;
    this.clearHeartbeat();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.socket?.close();
    this.socket = null;
  }

  async getPresence(userId: string): Promise<DiscordPresenceSnapshot | null> {
    return this.cache.getJson<DiscordPresenceSnapshot>(PRESENCE_KEY(userId));
  }

  async getPresenceMap(userIds: string[]): Promise<Map<string, DiscordPresenceSnapshot>> {
    const map = new Map<string, DiscordPresenceSnapshot>();
    await Promise.all(
      userIds.map(async (userId) => {
        const snapshot = await this.getPresence(userId);
        if (snapshot) map.set(userId, snapshot);
      }),
    );
    return map;
  }

  private connect(resume: boolean): void {
    if (!this.started || !this.botToken) return;

    const url = resume && this.resumeUrl ? `${this.resumeUrl}?v=10&encoding=json` : GATEWAY_URL;
    this.logsService.info("discord-bot", "Conectando gateway Discord.", { resume });

    const socket = new WebSocket(url);
    this.socket = socket;

    socket.addEventListener("open", () => {
      this.logsService.info("discord-bot", "Gateway Discord abierto.");
    });

    socket.addEventListener("message", (event) => {
      void this.onMessage(String(event.data));
    });

    socket.addEventListener("close", (event) => {
      this.logsService.warn("discord-bot", "Gateway Discord cerrado.", {
        code: event.code,
        reason: event.reason,
      });
      this.clearHeartbeat();
      this.socket = null;
      this.scheduleReconnect();
    });

    socket.addEventListener("error", () => {
      this.logsService.error("discord-bot", "Error en WebSocket del gateway Discord.");
    });
  }

  private scheduleReconnect(): void {
    if (!this.started) return;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect(Boolean(this.sessionId));
    }, 5_000);
  }

  private clearHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private send(payload: GatewayPayload): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return;
    this.socket.send(JSON.stringify(payload));
  }

  private async onMessage(raw: string): Promise<void> {
    let payload: GatewayPayload;
    try {
      payload = JSON.parse(raw) as GatewayPayload;
    } catch {
      return;
    }

    if (typeof payload.s === "number") {
      this.sequence = payload.s;
    }

    switch (payload.op) {
      case 10: {
        const hello = payload.d as { heartbeat_interval: number };
        this.startHeartbeat(hello.heartbeat_interval);
        if (this.sessionId && this.sequence != null) {
          this.send({
            op: 6,
            d: {
              token: this.botToken,
              session_id: this.sessionId,
              seq: this.sequence,
            },
          });
        } else {
          this.identify();
        }
        break;
      }
      case 11:
        break;
      case 0:
        await this.onDispatch(payload.t ?? null, payload.d);
        break;
      case 7:
        this.socket?.close();
        break;
      case 9:
        this.sessionId = null;
        this.sequence = null;
        this.identify();
        break;
      default:
        break;
    }
  }

  private identify(): void {
    this.send({
      op: 2,
      d: {
        token: this.botToken,
        intents: GATEWAY_INTENTS,
        properties: {
          os: "linux",
          browser: "mclaunch-backend",
          device: "mclaunch-backend",
        },
        presence: {
          status: "online",
          activities: [{ name: "Slaumcher", type: 0 }],
          afk: false,
        },
      },
    });
  }

  private startHeartbeat(intervalMs: number): void {
    this.clearHeartbeat();
    this.heartbeatInterval = setInterval(() => {
      this.send({ op: 1, d: this.sequence });
    }, intervalMs);
  }

  private async onDispatch(eventName: string | null, data: unknown): Promise<void> {
    if (!eventName) return;

    if (eventName === "READY") {
      const ready = data as {
        session_id?: string;
        resume_gateway_url?: string;
        guilds?: Array<{ id?: string }>;
      };
      this.sessionId = ready.session_id ?? null;
      this.resumeUrl = ready.resume_gateway_url?.replace("wss://", "wss://") ?? null;
      this.logsService.info("discord-bot", "Bot READY en Discord gateway.", {
        sessionId: this.sessionId,
        guilds: ready.guilds?.length ?? 0,
      });
      return;
    }

    // Seed presence cache from guild create payloads when available.
    if (eventName === "GUILD_CREATE") {
      const guild = data as {
        id?: string;
        presences?: Array<{
          user?: { id?: string };
          status?: string;
          activities?: Array<{ name?: string; type?: number }>;
        }>;
      };
      const presences = guild.presences ?? [];
      for (const presence of presences) {
        const userId = presence.user?.id;
        if (!userId) continue;
        const status = this.normalizeStatus(presence.status);
        await this.cache.setJson(
          PRESENCE_KEY(userId),
          {
            userId,
            status,
            activities: (presence.activities ?? [])
              .filter((activity) => typeof activity.name === "string")
              .map((activity) => ({
                name: activity.name as string,
                type: typeof activity.type === "number" ? activity.type : 0,
              })),
            updatedAt: Date.now(),
          } satisfies DiscordPresenceSnapshot,
          PRESENCE_TTL_SECONDS,
        );
      }
      if (presences.length > 0) {
        this.logsService.info("discord-bot", "Presencias iniciales de guild cacheadas.", {
          guildId: guild.id,
          count: presences.length,
        });
      }
      return;
    }

    if (eventName === "RESUMED") {
      this.logsService.info("discord-bot", "Sesion Discord reanudada.");
      return;
    }

    if (eventName === "PRESENCE_UPDATE") {
      const presence = data as {
        user?: { id?: string };
        status?: string;
        activities?: Array<{ name?: string; type?: number }>;
      };
      const userId = presence.user?.id;
      if (!userId) return;

      const status = this.normalizeStatus(presence.status);
      const snapshot: DiscordPresenceSnapshot = {
        userId,
        status,
        activities: (presence.activities ?? [])
          .filter((activity) => typeof activity.name === "string")
          .map((activity) => ({
            name: activity.name as string,
            type: typeof activity.type === "number" ? activity.type : 0,
          })),
        updatedAt: Date.now(),
      };

      await this.cache.setJson(PRESENCE_KEY(userId), snapshot, PRESENCE_TTL_SECONDS);
    }
  }

  private normalizeStatus(value: string | undefined): DiscordPresenceStatus {
    switch (value) {
      case "online":
      case "idle":
      case "dnd":
      case "offline":
      case "invisible":
        return value;
      default:
        return "unknown";
    }
  }
}
