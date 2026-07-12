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
  hydrate: () => Promise<void>;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  refreshFriends: () => Promise<void>;
};

const openAuthPopup = (url: string): Window | null => {
  try {
    return window.open(url, "mclaunch-discord-auth", "popup=yes,width=520,height=720,resizable=yes,scrollbars=yes");
  } catch {
    return null;
  }
};

const openExternalFallback = (url: string): void => {
  try {
    const openExternal = window.api?.openExternal;
    if (typeof openExternal === "function") {
      void Promise.resolve(openExternal(url));
      return;
    }
  } catch {
    // ignore
  }
  window.open(url, "_blank", "noopener,noreferrer");
};

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

  hydrate: async () => {
    set({ isLoading: true, lastError: null });

    try {
      const publicStatus = await discordApi.getStatus();
      set({ isConfigured: publicStatus.configured });

      if (!publicStatus.configured) {
        set({ link: null, friends: [], onlineCount: 0, isLoading: false });
        return;
      }

      const token = await useAppStore.getState().ensureBackendAccessToken();
      if (!token) {
        set({ link: null, friends: [], onlineCount: 0, isLoading: false });
        return;
      }

      try {
        const link = await discordApi.getMe(token);
        set({ link });
        const friendsPayload = await discordApi.getFriends(token, true);
        set({
          friends: friendsPayload.friends,
          onlineCount: friendsPayload.onlineCount,
          source: friendsPayload.source,
          note: friendsPayload.note,
          isLoading: false,
        });
      } catch (error) {
        if (
          error instanceof ApiError &&
          (error.statusCode === 404 || error.message.includes("DISCORD_NOT_LINKED") || error.message.includes("no tiene Discord"))
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
    if (!get().link) return;
    const token = await useAppStore.getState().ensureBackendAccessToken();
    if (!token) return;

    try {
      const friendsPayload = await discordApi.getFriends(token, true);
      set({
        friends: friendsPayload.friends,
        onlineCount: friendsPayload.onlineCount,
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

    const controller = new AbortController();
    let popup: Window | null = null;

    try {
      // User is already on the dashboard (Minecraft session), but Discord needs a backend JWT.
      const token = await useAppStore.getState().ensureBackendAccessToken();
      if (!token) {
        notify(
          "Discord",
          "No se pudo sincronizar la sesión con el servidor. Comprueba que el backend esté disponible e inténtalo de nuevo.",
          "warning",
        );
        set({ isLinking: false });
        return;
      }

      const session = await discordApi.startOAuth(token, controller.signal);
      popup = openAuthPopup(session.authorizeUrl);
      if (!popup) {
        openExternalFallback(session.authorizeUrl);
      }

      const result = await discordApi.waitForOAuth(token, session.sessionId, controller.signal);
      if (result.link) {
        set({ link: result.link });
      } else {
        const link = await discordApi.getMe(token);
        set({ link });
      }

      await get().refreshFriends();
      notify("Discord vinculado", "Tu cuenta de Discord quedó conectada al launcher.", "success");
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudo vincular Discord.";
      set({ lastError: message });
      notify("Discord", message, "error");
    } finally {
      if (popup && !popup.closed) popup.close();
      set({ isLinking: false });
    }
  },

  disconnect: async () => {
    const notify = useNotificationStore.getState().addNotification;
    const token = await useAppStore.getState().ensureBackendAccessToken();
    if (!token) return;

    try {
      await discordApi.unlink(token);
      set({ link: null, friends: [], onlineCount: 0, source: null, note: null });
      notify("Discord", "Cuenta de Discord desvinculada.", "info");
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudo desvincular Discord.";
      notify("Discord", message, "error");
    }
  },
}));
