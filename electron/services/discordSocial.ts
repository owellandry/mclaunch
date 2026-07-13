/**
 * Discord Social layer (prototype) via Discord Desktop IPC RPC.
 *
 * This is the same transport games use for presence/friends when Discord is running:
 * HANDSHAKE → READY → AUTHORIZE → AUTHENTICATE → GET_RELATIONSHIPS
 *
 * Full Discord Social SDK (C++/Unity/Unreal) is the long-term path; this prototype
 * lets us test the "Fortnite-style friends widget" experience inside Slaumcher.
 *
 * Requires Discord desktop app running + Application Client ID.
 * GET_RELATIONSHIPS needs scope relationships.read (Social SDK access / Discord approval).
 */

import { randomUUID } from "node:crypto";
import net from "node:net";
import path from "node:path";
import { shell } from "electron";

export type SocialFriend = {
  id: string;
  username: string;
  globalName: string | null;
  avatarUrl: string | null;
  status: "online" | "idle" | "dnd" | "offline" | "invisible" | "unknown";
  activity: string | null;
  isOnline: boolean;
  source: "discord_rpc";
};

export type SocialStatus = {
  connected: boolean;
  authenticated: boolean;
  discordUser: { id: string; username: string } | null;
  lastError: string | null;
  friendsCount: number;
};

type PendingRequest = {
  resolve: (data: unknown) => void;
  reject: (error: Error) => void;
  timer: ReturnType<typeof setTimeout>;
};

const OPCODE_HANDSHAKE = 0;
const OPCODE_FRAME = 1;
const OPCODE_CLOSE = 2;
const OPCODE_PING = 3;
const OPCODE_PONG = 4;
const MAX_PIPE_INDEX = 10;
const REQUEST_TIMEOUT_MS = 20_000;

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
    return `https://cdn.discordapp.com/embed/avatars/${Number(discriminator) % 5}.png`;
  }
  try {
    const index = Number((BigInt(userId) >> 22n) % 6n);
    return `https://cdn.discordapp.com/embed/avatars/${index}.png`;
  } catch {
    return null;
  }
};

class DiscordSocialService {
  private clientId = "";
  private socket: net.Socket | null = null;
  private isConnecting = false;
  private isReady = false;
  private authenticated = false;
  private accessToken: string | null = null;
  private discordUser: { id: string; username: string } | null = null;
  private lastError: string | null = null;
  private inboundBuffer = Buffer.alloc(0);
  private pending = new Map<string, PendingRequest>();
  private friendsCache: SocialFriend[] = [];

  configure(clientId: string): void {
    if (clientId && clientId !== this.clientId) {
      this.disconnect();
      this.clientId = clientId.trim();
    } else if (clientId) {
      this.clientId = clientId.trim();
    }
  }

  getStatus(): SocialStatus {
    return {
      connected: Boolean(this.socket && this.isReady),
      authenticated: this.authenticated,
      discordUser: this.discordUser,
      lastError: this.lastError,
      friendsCount: this.friendsCache.length,
    };
  }

  async ensureConnected(): Promise<void> {
    if (!this.clientId) {
      throw new Error("Discord Client ID no configurado (MCLAUNCH_DISCORD_CLIENT_ID).");
    }
    if (this.socket && this.isReady) return;
    await this.connect();
    if (!this.isReady) {
      throw new Error("Discord desktop no está abierto o no responde por IPC.");
    }
  }

  /**
   * Authorize via Discord desktop (native popup inside Discord app), exchange code on backend,
   * authenticate RPC session, then fetch relationships.
   */
  async linkAndFetchFriends(options: {
    redirectUri: string;
    exchangeCode: (code: string) => Promise<string>;
    scopes?: string[];
  }): Promise<SocialFriend[]> {
    await this.ensureConnected();

    const scopes = options.scopes ?? [
      "identify",
      "openid",
      "relationships.read",
      // Social layer presence (Social SDK style); ignored if not enabled for the app
      "sdk.social_layer_presence",
    ];

    try {
      const authResult = (await this.request("AUTHORIZE", {
        client_id: this.clientId,
        scopes,
        // Prefer Discord app UI for consent (same spirit as in-game linking)
        prompt: "none",
      })) as { code?: string };

      // prompt none may fail if not pre-authorized — retry with consent
      let code = authResult?.code;
      if (!code) {
        const authConsent = (await this.request("AUTHORIZE", {
          client_id: this.clientId,
          scopes,
        })) as { code?: string };
        code = authConsent?.code;
      }

      if (!code) {
        throw new Error("Discord no devolvió código de autorización (AUTHORIZE).");
      }

      const accessToken = await options.exchangeCode(code);
      this.accessToken = accessToken;

      const authn = (await this.request("AUTHENTICATE", {
        access_token: accessToken,
      })) as {
        user?: { id?: string; username?: string };
        scopes?: string[];
      };

      this.authenticated = true;
      this.discordUser = authn.user?.id
        ? { id: authn.user.id, username: authn.user.username || "Discord" }
        : null;
      this.lastError = null;

      return await this.fetchRelationships();
    } catch (error) {
      this.lastError = error instanceof Error ? error.message : String(error);
      // If relationships.read is not approved, still try a lighter path
      if (this.lastError.includes("relationships") || this.lastError.includes("4006") || this.lastError.includes("Invalid")) {
        try {
          return await this.fetchRelationshipsBestEffort();
        } catch {
          /* keep original error */
        }
      }
      throw error;
    }
  }

  async fetchRelationships(): Promise<SocialFriend[]> {
    await this.ensureConnected();
    if (!this.authenticated && this.accessToken) {
      await this.request("AUTHENTICATE", { access_token: this.accessToken });
      this.authenticated = true;
    }

    const data = (await this.request("GET_RELATIONSHIPS", {})) as {
      relationships?: Array<{
        type?: number;
        user?: {
          id?: string;
          username?: string;
          global_name?: string | null;
          avatar?: string | null;
          discriminator?: string;
        };
        presence?: {
          status?: string;
          activity?: { name?: string } | null;
        };
      }>;
    };

    const list = data.relationships ?? [];
    // type 1 = friend (Discord relationship type)
    const friends: SocialFriend[] = list
      .filter((rel) => rel.type === 1 && rel.user?.id)
      .map((rel) => {
        const user = rel.user!;
        const statusRaw = (rel.presence?.status || "offline").toLowerCase();
        const status = this.normalizeStatus(statusRaw);
        const isOnline = status === "online" || status === "idle" || status === "dnd";
        return {
          id: user.id!,
          username: user.username || "User",
          globalName: user.global_name ?? null,
          avatarUrl: buildAvatarUrl(user.id!, user.avatar, user.discriminator),
          status,
          activity: rel.presence?.activity?.name ?? null,
          isOnline,
          source: "discord_rpc" as const,
        };
      })
      .sort((a, b) => Number(b.isOnline) - Number(a.isOnline));

    this.friendsCache = friends;
    this.lastError = null;
    return friends;
  }

  /** Invite / open friend in Discord (prototype of "call to play"). */
  async openFriend(friendId: string): Promise<void> {
    // Opens Discord user profile / DM entry point
    const url = `discord://-/users/${friendId}`;
    await shell.openExternal(url);
  }

  getCachedFriends(): SocialFriend[] {
    return this.friendsCache;
  }

  private async fetchRelationshipsBestEffort(): Promise<SocialFriend[]> {
    try {
      return await this.fetchRelationships();
    } catch (error) {
      this.lastError =
        (error instanceof Error ? error.message : String(error)) +
        " — Activa Social SDK / relationships.read en el portal de Discord y vuelve a autorizar.";
      this.friendsCache = [];
      throw new Error(this.lastError);
    }
  }

  private normalizeStatus(value: string): SocialFriend["status"] {
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

  private request(cmd: string, args: Record<string, unknown> = {}): Promise<unknown> {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.isReady) {
        reject(new Error("IPC de Discord no listo."));
        return;
      }
      const nonce = randomUUID();
      const timer = setTimeout(() => {
        this.pending.delete(nonce);
        reject(new Error(`Timeout Discord RPC: ${cmd}`));
      }, REQUEST_TIMEOUT_MS);

      this.pending.set(nonce, {
        resolve: (data) => resolve(data),
        reject,
        timer,
      });

      this.sendFrame(OPCODE_FRAME, { cmd, args, nonce });
    });
  }

  private async connect(): Promise<void> {
    if (!this.clientId || this.socket || this.isConnecting) {
      if (this.isReady) return;
    }
    this.isConnecting = true;

    for (const ipcPath of this.getIpcPaths()) {
      try {
        const socket = await this.connectToPath(ipcPath);
        this.attachSocket(socket);
        this.sendFrame(OPCODE_HANDSHAKE, { v: 1, client_id: this.clientId });
        await this.waitUntilReady(8_000);
        return;
      } catch {
        continue;
      }
    }

    this.isConnecting = false;
    throw new Error("No se pudo conectar al Discord desktop (abre Discord e inténtalo de nuevo).");
  }

  private waitUntilReady(timeoutMs: number): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.isReady) {
        resolve();
        return;
      }
      const started = Date.now();
      const tick = () => {
        if (this.isReady) {
          resolve();
          return;
        }
        if (Date.now() - started > timeoutMs) {
          reject(new Error("Timeout esperando READY de Discord IPC."));
          return;
        }
        setTimeout(tick, 50);
      };
      tick();
    });
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
      Array.from({ length: MAX_PIPE_INDEX }, (_, i) => path.join(dir, `discord-ipc-${i}`)),
    );
  }

  private connectToPath(ipcPath: string): Promise<net.Socket> {
    return new Promise((resolve, reject) => {
      const socket = net.createConnection(ipcPath);
      const onError = (error: Error) => {
        socket.destroy();
        reject(error);
      };
      socket.once("error", onError);
      socket.once("connect", () => {
        socket.off("error", onError);
        resolve(socket);
      });
    });
  }

  private attachSocket(socket: net.Socket): void {
    this.socket = socket;
    this.isConnecting = false;
    this.inboundBuffer = Buffer.alloc(0);
    this.isReady = false;
    this.authenticated = false;

    socket.on("data", (chunk) => {
      this.handleData(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    });
    socket.on("error", () => this.handleDisconnect(socket));
    socket.on("close", () => this.handleDisconnect(socket));
  }

  private handleDisconnect(socket: net.Socket): void {
    if (this.socket !== socket) return;
    this.socket = null;
    this.isReady = false;
    this.isConnecting = false;
    this.authenticated = false;
    this.inboundBuffer = Buffer.alloc(0);
    for (const [, pending] of this.pending) {
      clearTimeout(pending.timer);
      pending.reject(new Error("Conexión Discord IPC cerrada."));
    }
    this.pending.clear();
  }

  private disconnect(): void {
    if (this.socket) {
      try {
        this.sendFrame(OPCODE_CLOSE, { code: 1000, message: "bye" });
      } catch {
        /* ignore */
      }
      this.socket.destroy();
    }
    this.handleDisconnect(this.socket as net.Socket);
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
          payload = JSON.parse(payloadBuffer.toString("utf8")) as Record<string, unknown>;
        } catch {
          continue;
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
      if (opcode !== OPCODE_FRAME) continue;

      if (payload.evt === "READY") {
        this.isReady = true;
        const data = payload.data as { user?: { id?: string; username?: string } } | undefined;
        if (data?.user?.id) {
          this.discordUser = {
            id: data.user.id,
            username: data.user.username || "Discord",
          };
        }
        continue;
      }

      if (payload.evt === "ERROR") {
        const nonce = typeof payload.nonce === "string" ? payload.nonce : "";
        const data = payload.data as { message?: string; code?: number } | undefined;
        const pending = this.pending.get(nonce);
        if (pending) {
          clearTimeout(pending.timer);
          this.pending.delete(nonce);
          pending.reject(
            new Error(data?.message || `Discord RPC error ${data?.code ?? ""}`.trim()),
          );
        }
        continue;
      }

      // Command responses echo cmd + nonce
      const nonce = typeof payload.nonce === "string" ? payload.nonce : "";
      const pending = this.pending.get(nonce);
      if (pending) {
        clearTimeout(pending.timer);
        this.pending.delete(nonce);
        if (payload.evt === "ERROR") {
          const data = payload.data as { message?: string } | undefined;
          pending.reject(new Error(data?.message || "Discord RPC ERROR"));
        } else {
          pending.resolve(payload.data);
        }
      }
    }
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

export const discordSocial = new DiscordSocialService();
