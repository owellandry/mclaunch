import net from "node:net";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { app } from "electron";

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

const createDefaultPresence = (): PresenceContext => ({
  mode: "launcher",
  startedAt: Date.now(),
});

class DiscordPresenceService {
  private readonly clientId = process.env.MCLAUNCH_DISCORD_CLIENT_ID?.trim() ?? "";
  private socket: net.Socket | null = null;
  private isConnecting = false;
  private isReady = false;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private inboundBuffer = Buffer.alloc(0);
  private currentPresence: PresenceContext = createDefaultPresence();

  start(): void {
    if (!this.clientId) {
      console.warn("[Discord] MCLAUNCH_DISCORD_CLIENT_ID no está definido — Rich Presence desactivado.");
      return;
    }

    console.log(`[Discord] Iniciando Rich Presence con clientId=${this.clientId}`);
    this.setLauncherPresence();
    void this.connect();
  }

  stop(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.socket && this.isReady) {
      this.sendFrame(OPCODE_FRAME, {
        cmd: "SET_ACTIVITY",
        args: {
          pid: process.pid,
          activity: null,
        },
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
    this.currentPresence = {
      mode: "launcher",
      startedAt: Date.now(),
    };

    this.flushPresence();
  }

  setLaunchingPresence(payload: { username?: string; version?: string }): void {
    this.currentPresence = {
      mode: "launching",
      startedAt: Date.now(),
      username: payload.username,
      version: payload.version,
    };

    this.flushPresence();
  }

  setPlayingPresence(payload: { username?: string; version?: string }): void {
    this.currentPresence = {
      mode: "playing",
      startedAt: Date.now(),
      username: payload.username,
      version: payload.version,
    };

    this.flushPresence();
  }

  private async connect(): Promise<void> {
    if (!this.clientId || this.socket || this.isConnecting) {
      return;
    }

    this.isConnecting = true;

    for (const ipcPath of this.getIpcPaths()) {
      try {
        const socket = await this.connectToPath(ipcPath);
        console.log(`[Discord] Conectado al pipe: ${ipcPath}`);
        this.attachSocket(socket);
        this.sendFrame(OPCODE_HANDSHAKE, {
          v: 1,
          client_id: this.clientId,
        });
        return;
      } catch {
        continue;
      }
    }

    console.warn("[Discord] No se encontró ningún pipe de Discord. ¿Está Discord abierto?");
    this.isConnecting = false;
    this.scheduleReconnect();
  }

  private getIpcPaths(): string[] {
    if (process.platform === "win32") {
      return Array.from({ length: MAX_PIPE_INDEX }, (_, index) => [
        `\\\\.\\pipe\\discord-ipc-${index}`,
        `\\\\?\\pipe\\discord-ipc-${index}`,
      ]).flat();
    }

    const runtimeDirs = [
      process.env.XDG_RUNTIME_DIR,
      process.env.TMPDIR,
      process.env.TEMP,
      process.env.TMP,
      "/tmp",
    ].filter((value): value is string => Boolean(value));

    return runtimeDirs.flatMap((dir) =>
      Array.from({ length: MAX_PIPE_INDEX }, (_, index) => path.join(dir, `discord-ipc-${index}`))
    );
  }

  private connectToPath(ipcPath: string): Promise<net.Socket> {
    return new Promise((resolve, reject) => {
      const socket = net.createConnection(ipcPath);

      const handleError = (error: Error): void => {
        cleanup();
        socket.destroy();
        reject(error);
      };

      const handleConnect = (): void => {
        cleanup();
        resolve(socket);
      };

      const cleanup = (): void => {
        socket.off("error", handleError);
        socket.off("connect", handleConnect);
      };

      socket.once("error", handleError);
      socket.once("connect", handleConnect);
    });
  }

  private attachSocket(socket: net.Socket): void {
    this.socket = socket;
    this.isConnecting = false;
    this.inboundBuffer = Buffer.alloc(0);

    socket.on("data", (chunk: Buffer) => {
      this.handleData(chunk);
    });

    socket.on("error", () => {
      this.handleDisconnect(socket);
    });

    socket.on("close", () => {
      this.handleDisconnect(socket);
    });
  }

  private handleDisconnect(socket: net.Socket): void {
    if (this.socket !== socket) {
      return;
    }

    this.socket = null;
    this.isReady = false;
    this.isConnecting = false;
    this.inboundBuffer = Buffer.alloc(0);
    this.scheduleReconnect();
  }

  private scheduleReconnect(): void {
    if (!this.clientId || this.reconnectTimer) {
      return;
    }

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

      if (this.inboundBuffer.length < 8 + payloadLength) {
        return;
      }

      const payloadBuffer = this.inboundBuffer.subarray(8, 8 + payloadLength);
      this.inboundBuffer = this.inboundBuffer.subarray(8 + payloadLength);

      let payload: Record<string, unknown> = {};
      if (payloadBuffer.length > 0) {
        try {
          payload = JSON.parse(payloadBuffer.toString("utf8")) as Record<string, unknown>;
        } catch {
          payload = {};
        }
      }

      if (opcode === OPCODE_PING) {
        this.sendFrame(OPCODE_PONG, payload);
        continue;
      }

      if (opcode === OPCODE_CLOSE) {
        this.socket?.destroy();
        return;
      }

      if (opcode === OPCODE_FRAME) {
        if (payload.evt === "READY") {
          console.log("[Discord] READY recibido — enviando presencia.");
          this.isReady = true;
          this.flushPresence();
        } else if (payload.evt === "ERROR") {
          const data = payload.data as Record<string, unknown> | undefined;
          console.error(
            `[Discord] ERROR del servidor: código=${data?.code} mensaje="${data?.message}"\n` +
            `  → Verifica que el Client ID "${this.clientId}" existe en discord.com/developers/applications`
          );
        }
      }
    }
  }

  private flushPresence(): void {
    if (!this.clientId) {
      return;
    }

    if (!this.socket || !this.isReady) {
      void this.connect();
      return;
    }

    console.log(`[Discord] Enviando actividad (modo=${this.currentPresence.mode})`);
    this.sendFrame(OPCODE_FRAME, {
      cmd: "SET_ACTIVITY",
      args: {
        pid: process.pid,
        activity: this.buildActivity(),
      },
      nonce: randomUUID(),
    });
  }

  private buildActivity(): Record<string, unknown> {
    const { mode, startedAt, username, version } = this.currentPresence;
    const baseActivity = {
      timestamps: {
        start: Math.floor(startedAt / 1000),
      },
      instance: false,
    };

    if (mode === "launching") {
      return {
        ...baseActivity,
        details: "Preparando Minecraft",
        state: version
          ? `${username ?? "Jugador"} | ${version}`
          : `${username ?? "Jugador"} | Inicializando`,
      };
    }

    if (mode === "playing") {
      return {
        ...baseActivity,
        details: "Jugando con MC Launch",
        state: version
          ? `${username ?? "Jugador"} | Minecraft ${version}`
          : `${username ?? "Jugador"} | En partida`,
      };
    }

    return {
      ...baseActivity,
      details: "Usando MC Launch",
      state: "Explorando el launcher",
    };
  }

  private sendFrame(opcode: number, payload: Record<string, unknown>): void {
    if (!this.socket || !this.socket.writable) {
      return;
    }

    const payloadBuffer = Buffer.from(JSON.stringify(payload), "utf8");
    const headerBuffer = Buffer.alloc(8);
    headerBuffer.writeInt32LE(opcode, 0);
    headerBuffer.writeInt32LE(payloadBuffer.length, 4);
    this.socket.write(Buffer.concat([headerBuffer, payloadBuffer]));
  }
}

export const discordPresence = new DiscordPresenceService();
