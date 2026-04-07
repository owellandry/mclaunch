type LauncherActivityMode = "launcher" | "launching" | "playing";

type LauncherPresenceContext = {
  mode: LauncherActivityMode;
  startedAt: number;
  username?: string;
  version?: string;
};

type LauncherSocketWelcomeMessage = {
  type: "welcome";
  sessionId: string;
  serverTime: number;
  config?: {
    discordClientId?: string | null;
  };
};

const RECONNECT_DELAY_MS = 10_000;

const createDefaultPresence = (): LauncherPresenceContext => ({
  mode: "launcher",
  startedAt: Date.now(),
});

const resolveSocketUrl = (apiBaseUrl?: string): string => {
  const baseUrl = apiBaseUrl?.trim() || process.env.MCLAUNCH_API_BASE_URL?.trim() || "http://127.0.0.1:8787";
  const parsed = new URL(baseUrl);
  parsed.protocol = parsed.protocol === "https:" ? "wss:" : "ws:";
  parsed.pathname = "/ws/v1/launcher";
  parsed.search = "";
  parsed.hash = "";
  return parsed.toString();
};

class LauncherActivitySocketService {
  private socket: WebSocket | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private currentPresence: LauncherPresenceContext = createDefaultPresence();
  private socketUrl = "";
  private launcherVersion = "0.0.0";
  private isStopping = false;
  private onWelcomeConfig: ((payload: { discordClientId: string | null }) => void) | null = null;
  private lastDiscordClientId: string | null = null;

  start(
    options?: {
      apiBaseUrl?: string | undefined;
      launcherVersion?: string | undefined;
      onWelcomeConfig?: ((payload: { discordClientId: string | null }) => void) | undefined;
    },
  ): void {
    this.isStopping = false;
    this.socketUrl = resolveSocketUrl(options?.apiBaseUrl);
    this.launcherVersion = options?.launcherVersion?.trim() || this.launcherVersion;
    this.onWelcomeConfig = options?.onWelcomeConfig ?? this.onWelcomeConfig;
    this.connect();
  }

  stop(): void {
    this.isStopping = true;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = null;
    this.socket?.close();
    this.socket = null;
  }

  setLauncherPresence(): void {
    this.currentPresence = { mode: "launcher", startedAt: Date.now() };
    this.flushPresence();
  }

  setLaunchingPresence(payload: { username?: string; version?: string }): void {
    this.currentPresence = { mode: "launching", startedAt: Date.now(), ...payload };
    this.flushPresence();
  }

  setPlayingPresence(payload: { username?: string; version?: string }): void {
    this.currentPresence = { mode: "playing", startedAt: Date.now(), ...payload };
    this.flushPresence();
  }

  private connect(): void {
    if (!this.socketUrl || this.socket?.readyState === WebSocket.OPEN || this.socket?.readyState === WebSocket.CONNECTING) {
      return;
    }

    const socket = new WebSocket(this.socketUrl);
    this.socket = socket;

    socket.addEventListener("open", () => {
      this.send({
        type: "hello",
        launcherVersion: this.launcherVersion,
        platform: process.platform,
        arch: process.arch,
      });
      this.flushPresence();
    });

    socket.addEventListener("message", (event) => {
      if (typeof event.data !== "string") return;
      this.handleMessage(event.data);
    });

    socket.addEventListener("close", () => {
      if (this.socket === socket) {
        this.socket = null;
      }
      if (this.isStopping) return;
      this.scheduleReconnect();
    });

    socket.addEventListener("error", () => {
      socket.close();
    });
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, RECONNECT_DELAY_MS);
  }

  private handleMessage(raw: string): void {
    let payload: unknown;

    try {
      payload = JSON.parse(raw);
    } catch {
      return;
    }

    if (!payload || typeof payload !== "object") return;
    const message = payload as Partial<LauncherSocketWelcomeMessage>;
    if (message.type !== "welcome") return;

    const discordClientId = message.config?.discordClientId?.trim() || null;
    if (discordClientId === this.lastDiscordClientId) return;

    this.lastDiscordClientId = discordClientId;
    this.onWelcomeConfig?.({ discordClientId });
  }

  private flushPresence(): void {
    this.send({
      type: "activity",
      mode: this.currentPresence.mode,
      startedAt: this.currentPresence.startedAt,
      username: this.currentPresence.username,
      version: this.currentPresence.version,
    });
  }

  private send(payload: Record<string, unknown>): void {
    if (this.socket?.readyState !== WebSocket.OPEN) return;
    this.socket.send(JSON.stringify(payload));
  }
}

export const launcherActivitySocket = new LauncherActivitySocketService();
