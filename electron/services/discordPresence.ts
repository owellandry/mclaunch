import { randomUUID } from "node:crypto";
import net from "node:net";
import path from "node:path";

type PresenceMode = "launcher" | "launching" | "playing";

type PresenceContext = {
  mode: PresenceMode;
  startedAt: number;
  username?: string;
  version?: string;
};

const OPCODE_HANDSHAKE = 0;
const OPCODE_FRAME = 1;
const OPCODE_CLOSE = 2;
const OPCODE_PING = 3;
const OPCODE_PONG = 4;
const MAX_PIPE_INDEX = 10;
const RECONNECT_DELAY_MS = 15_000;
const shouldLogDebug = process.env.DEBUG_DISCORD_PRESENCE === "1";

const logDebug = (message: string): void => {
  if (shouldLogDebug) {
    console.info(`[Discord] ${message}`);
  }
};

const createDefaultPresence = (): PresenceContext => ({
  mode: "launcher",
  startedAt: Date.now(),
});

class DiscordPresenceService {
  private clientId = "";
  private socket: net.Socket | null = null;
  private isConnecting = false;
  private isReady = false;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private inboundBuffer = Buffer.alloc(0);
  private currentPresence: PresenceContext = createDefaultPresence();

  async start(options?: { clientId?: string | null }): Promise<void> {
    const nextClientId = options?.clientId?.trim() || this.clientId;
    if (!nextClientId) return;

    if (this.clientId && this.clientId !== nextClientId) {
      this.stop();
    }

    this.clientId = nextClientId;
    this.setLauncherPresence();
    void this.connect();
  }

  stop(): void {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);

    if (this.socket && this.isReady) {
      this.sendFrame(OPCODE_FRAME, {
        cmd: "SET_ACTIVITY",
        args: { pid: process.pid, activity: null },
        nonce: randomUUID(),
      });
    }

    this.isReady = false;
    this.isConnecting = false;
    this.inboundBuffer = Buffer.alloc(0);
    this.socket?.destroy();
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

  private async connect(): Promise<void> {
    if (!this.clientId || this.socket || this.isConnecting) return;

    this.isConnecting = true;

    for (const ipcPath of this.getIpcPaths()) {
      try {
        const socket = await this.connectToPath(ipcPath);
        logDebug(`Conectado al pipe ${ipcPath}`);
        this.attachSocket(socket);
        this.sendFrame(OPCODE_HANDSHAKE, { v: 1, client_id: this.clientId });
        return;
      } catch {
        continue;
      }
    }

    logDebug("Discord no esta disponible todavia; se reintentara.");
    this.isConnecting = false;
    this.scheduleReconnect();
  }

  private getIpcPaths(): string[] {
    if (process.platform === "win32") {
      return Array.from({ length: MAX_PIPE_INDEX }, (_, i) => [
        `\\\\.\\pipe\\discord-ipc-${i}`,
        `\\\\?\\pipe\\discord-ipc-${i}`,
      ]).flat();
    }

    const runtimeDirs = [
      process.env.XDG_RUNTIME_DIR,
      process.env.TMPDIR,
      process.env.TEMP,
      process.env.TMP,
      "/tmp",
    ].filter(Boolean) as string[];

    return runtimeDirs.flatMap((dir) =>
      Array.from({ length: MAX_PIPE_INDEX }, (_, i) =>
        path.join(dir, `discord-ipc-${i}`)
      )
    );
  }

  private connectToPath(ipcPath: string): Promise<net.Socket> {
    return new Promise((resolve, reject) => {
      const socket = net.createConnection(ipcPath);

      const handleError = (error: Error) => {
        socket.destroy();
        reject(error);
      };

      const handleConnect = () => {
        socket.off("error", handleError);
        resolve(socket);
      };

      socket.once("error", handleError);
      socket.once("connect", handleConnect);
    });
  }

  private attachSocket(socket: net.Socket): void {
    this.socket = socket;
    this.isConnecting = false;
    this.inboundBuffer = Buffer.alloc(0);

    socket.on("data", (chunk) => {
      const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      this.handleData(buffer);
    });

    socket.on("error", () => this.handleDisconnect(socket));
    socket.on("close", () => this.handleDisconnect(socket));
  }

  private handleDisconnect(socket: net.Socket): void {
    if (this.socket !== socket) return;

    this.socket = null;
    this.isReady = false;
    this.isConnecting = false;
    this.inboundBuffer = Buffer.alloc(0);
    this.scheduleReconnect();
  }

  private scheduleReconnect(): void {
    if (!this.clientId || this.reconnectTimer) return;

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      void this.connect();
    }, RECONNECT_DELAY_MS);
  }

  private handleData(chunk: Buffer): void {
    this.inboundBuffer = Buffer.concat([this.inboundBuffer, chunk]);

    while (this.inboundBuffer.length >= 8) {
      const opcode = this.inboundBuffer.readInt32LE(0);
      const payloadLength = this.inboundBuffer.readInt32LE(4);

      if (this.inboundBuffer.length < 8 + payloadLength) return;

      const payloadBuffer = this.inboundBuffer.subarray(8, 8 + payloadLength);
      this.inboundBuffer = this.inboundBuffer.subarray(8 + payloadLength);

      let payload: Record<string, unknown> = {};
      if (payloadBuffer.length > 0) {
        try {
          payload = JSON.parse(payloadBuffer.toString("utf8"));
        } catch {}
      }

      if (opcode === OPCODE_PING) {
        this.sendFrame(OPCODE_PONG, payload);
        continue;
      }

      if (opcode === OPCODE_CLOSE) {
        this.socket?.destroy();
        return;
      }

      if (opcode === OPCODE_FRAME && payload.evt === "READY") {
        this.isReady = true;
        this.flushPresence();
      }
    }
  }

  private flushPresence(): void {
    if (!this.clientId || !this.socket || !this.isReady) {
      void this.connect();
      return;
    }

    this.sendFrame(OPCODE_FRAME, {
      cmd: "SET_ACTIVITY",
      args: { pid: process.pid, activity: this.buildActivity() },
      nonce: randomUUID(),
    });
  }

  private buildActivity(): Record<string, unknown> {
    const { mode, startedAt, username, version } = this.currentPresence;

    const base = {
      timestamps: { start: Math.floor(startedAt / 1000) },
      instance: false,
    };

    if (mode === "launching") {
      return {
        ...base,
        details: "Preparando Minecraft",
        state: version
          ? `${username ?? "Jugador"} | ${version}`
          : `${username ?? "Jugador"} | Inicializando`,
      };
    }

    if (mode === "playing") {
      return {
        ...base,
        details: "Jugando con Slaumcher",
        state: version
          ? `${username ?? "Jugador"} | Minecraft ${version}`
          : `${username ?? "Jugador"} | En partida`,
      };
    }

    return {
      ...base,
      details: "Usando Slaumcher",
      state: "Explorando el launcher",
    };
  }

  private sendFrame(opcode: number, payload: Record<string, unknown>): void {
    if (!this.socket?.writable) return;

    const payloadBuffer = Buffer.from(JSON.stringify(payload), "utf8");
    const header = Buffer.alloc(8);

    header.writeInt32LE(opcode, 0);
    header.writeInt32LE(payloadBuffer.length, 4);

    this.socket.write(Buffer.concat([header, payloadBuffer]));
  }
}

export const discordPresence = new DiscordPresenceService();
