import { create } from "zustand";
import {
  discordApi,
  type DiscordFriend,
  type DiscordLink,
} from "@/infrastructure/api/discordApi";
import { useAppStore } from "./useAppStore";
import { useNotificationStore } from "./useNotificationStore";
import { ApiError } from "@/core/errors/ApiError";

type DiscordState = {
  link: DiscordLink | null;
  friends: DiscordFriend[];
  onlineCount: number;
  source: string | null;
  note: string | null;
  isLoading: boolean;
  isLinking: boolean;
  isConfigured: boolean | null;
  lastError: string | null;
  socialMode: "rpc" | "backend" | null;
  hydrate: () => Promise<void>;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  refreshFriends: () => Promise<void>;
  openFriend: (friendId: string) => Promise<void>;
};

const mapRpcFriends = (
  friends: Array<{
    id: string;
    username: string;
    globalName: string | null;
    avatarUrl: string | null;
    status: string;
    activity: string | null;
    isOnline: boolean;
    source: string;
  }>,
): DiscordFriend[] =>
  friends.map((f) => ({
    id: f.id,
    username: f.username,
    globalName: f.globalName,
    avatarUrl: f.avatarUrl,
    status: (f.status as DiscordFriend["status"]) || "unknown",
    activity: f.activity,
    isOnline: f.isOnline,
    source: f.source === "discord_rpc" ? "relationships" : "launcher_network",
  }));

export const useDiscordStore = create<DiscordState>((set, get) => ({
  link: null,
  friends: [],
  onlineCount: 0,
  source: null,
  note: null,
  isLoading: false,
  isLinking: false,
  isConfigured: null,
  lastError: null,
  socialMode: null,

  hydrate: async () => {
    set({ isLoading: true, lastError: null });

    try {
      // Prefer Discord Desktop RPC social layer when available (real friends + presence).
      if (typeof window.api?.discordSocialStatus === "function") {
        try {
          const status = await window.api.discordSocialStatus();
          if (status.connected && status.authenticated) {
            const refreshed = await window.api.discordSocialRefreshFriends();
            const friends = mapRpcFriends(refreshed.friends);
            set({
              link: status.discordUser
                ? {
                    id: status.discordUser.id,
                    accountId: "",
                    discordUserId: status.discordUser.id,
                    username: status.discordUser.username,
                    globalName: null,
                    discriminator: null,
                    avatarUrl: null,
                    scopes: "rpc",
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                  }
                : get().link,
              friends,
              onlineCount: friends.filter((f) => f.isOnline).length || friends.length,
              source: "relationships",
              note: "Amigos vía Discord Desktop (RPC) — estilo Social SDK.",
              socialMode: "rpc",
              isLoading: false,
              isConfigured: true,
            });
            return;
          }
        } catch {
          /* fall through to backend */
        }
      }

      const publicStatus = await discordApi.getStatus();
      set({ isConfigured: publicStatus.configured });

      if (!publicStatus.configured) {
        set({ link: null, friends: [], onlineCount: 0, isLoading: false, socialMode: null });
        return;
      }

      const token = await useAppStore.getState().ensureBackendAccessToken();
      if (!token) {
        set({ link: null, friends: [], onlineCount: 0, isLoading: false });
        return;
      }

      try {
        const link = await discordApi.getMe(token);
        set({ link, socialMode: "backend" });
        const friendsPayload = await discordApi.getFriends(token, true);
        set({
          friends: friendsPayload.friends,
          onlineCount:
            friendsPayload.onlineCount ||
            friendsPayload.friends.filter((f) => f.isOnline).length ||
            friendsPayload.friends.length,
          source: friendsPayload.source,
          note: friendsPayload.note,
          isLoading: false,
        });
      } catch (error) {
        if (
          error instanceof ApiError &&
          (error.statusCode === 404 ||
            error.message.includes("DISCORD_NOT_LINKED") ||
            error.message.includes("no tiene Discord"))
        ) {
          set({ link: null, friends: [], onlineCount: 0, isLoading: false });
          return;
        }
        throw error;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudo cargar Discord.";
      set({ lastError: message, isLoading: false });
    }
  },

  refreshFriends: async () => {
    if (get().socialMode === "rpc" && typeof window.api?.discordSocialRefreshFriends === "function") {
      try {
        const refreshed = await window.api.discordSocialRefreshFriends();
        const friends = mapRpcFriends(refreshed.friends);
        set({
          friends,
          onlineCount: friends.filter((f) => f.isOnline).length || friends.length,
          lastError: null,
        });
      } catch (error) {
        set({
          lastError: error instanceof Error ? error.message : "No se pudieron refrescar amigos RPC.",
        });
      }
      return;
    }

    if (!get().link) return;
    const token = await useAppStore.getState().ensureBackendAccessToken();
    if (!token) return;

    try {
      const friendsPayload = await discordApi.getFriends(token, true);
      set({
        friends: friendsPayload.friends,
        onlineCount:
          friendsPayload.onlineCount ||
          friendsPayload.friends.filter((f) => f.isOnline).length ||
          friendsPayload.friends.length,
        source: friendsPayload.source,
        note: friendsPayload.note,
        lastError: null,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudieron refrescar amigos.";
      set({ lastError: message });
    }
  },

  connect: async () => {
    const notify = useNotificationStore.getState().addNotification;
    if (get().isLinking) return;
    set({ isLinking: true, lastError: null });

    try {
      // 1) Prefer Discord Desktop Social RPC (real friends like Fortnite widget)
      if (typeof window.api?.discordSocialLinkFriends === "function") {
        try {
          notify("Discord", "Abre Discord desktop y autoriza Slaumcher…", "info");
          const result = await window.api.discordSocialLinkFriends();
          const friends = mapRpcFriends(result.friends);
          set({
            link: result.status.discordUser
              ? {
                  id: result.status.discordUser.id,
                  accountId: "",
                  discordUserId: result.status.discordUser.id,
                  username: result.status.discordUser.username,
                  globalName: null,
                  discriminator: null,
                  avatarUrl: null,
                  scopes: "rpc",
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                }
              : get().link,
            friends,
            onlineCount: friends.filter((f) => f.isOnline).length || friends.length,
            source: "relationships",
            note: "Amigos reales vía Discord Desktop (RPC Social).",
            socialMode: "rpc",
            isLinking: false,
            isConfigured: true,
          });
          notify(
            "Discord Social",
            friends.length
              ? `${friends.length} contactos cargados (${friends.filter((f) => f.isOnline).length} online).`
              : "Conectado. Si no hay amigos, revisa scope relationships.read / Social SDK en el portal.",
            "success",
          );
          return;
        } catch (rpcError) {
          console.warn("[discord] Social RPC falló, fallback OAuth backend:", rpcError);
          notify(
            "Discord Social",
            rpcError instanceof Error
              ? `${rpcError.message} — Intentando vínculo web…`
              : "RPC falló — intentando vínculo web…",
            "warning",
          );
        }
      }

      // 2) Fallback: existing web OAuth + backend friends
      const token = await useAppStore.getState().ensureBackendAccessToken();
      if (!token) {
        notify(
          "Discord",
          "No se pudo sincronizar la sesión con el servidor y Discord desktop no respondió.",
          "warning",
        );
        set({ isLinking: false });
        return;
      }

      const controller = new AbortController();
      const session = await discordApi.startOAuth(token, controller.signal);

      if (typeof window.api?.openBackendLoginPopup === "function") {
        void window.api
          .openBackendLoginPopup({
            authorizeUrl: session.authorizeUrl,
            callbackUrl: session.callbackUrl,
          })
          .catch(() => undefined);
      } else {
        window.open(session.authorizeUrl, "mclaunch-discord-auth", "popup=yes,width=480,height=680");
      }

      const result = await discordApi.waitForOAuth(token, session.sessionId, controller.signal);
      if (result.link) set({ link: result.link });
      else set({ link: await discordApi.getMe(token) });

      set({ socialMode: "backend" });
      await get().refreshFriends();
      notify("Discord vinculado", "Cuenta conectada (modo backend).", "success");
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudo vincular Discord.";
      set({ lastError: message });
      notify("Discord", message, "error");
    } finally {
      set({ isLinking: false });
    }
  },

  disconnect: async () => {
    const notify = useNotificationStore.getState().addNotification;
    if (get().socialMode === "rpc") {
      set({ link: null, friends: [], onlineCount: 0, socialMode: null, note: null });
      notify("Discord", "Sesión social local limpiada.", "info");
      return;
    }
    const token = await useAppStore.getState().ensureBackendAccessToken();
    if (!token) return;
    try {
      await discordApi.unlink(token);
      set({ link: null, friends: [], onlineCount: 0, source: null, note: null, socialMode: null });
      notify("Discord", "Cuenta de Discord desvinculada.", "info");
    } catch (error) {
      notify("Discord", error instanceof Error ? error.message : "Error al desvincular.", "error");
    }
  },

  openFriend: async (friendId: string) => {
    if (typeof window.api?.discordSocialOpenFriend === "function") {
      await window.api.discordSocialOpenFriend(friendId);
      return;
    }
    window.open(`https://discord.com/users/${friendId}`, "_blank", "noopener,noreferrer");
  },
}));
