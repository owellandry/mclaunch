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

/**
 * Opens Discord OAuth inside the launcher (Electron child window), matching Microsoft login.
 * Falls back to a browser popup only outside Electron (e.g. pure Vite).
 */
const openDiscordAuthInApp = async (authorizeUrl: string, callbackUrl: string): Promise<void> => {
  if (typeof window.api?.openBackendLoginPopup === "function") {
    await window.api.openBackendLoginPopup({ authorizeUrl, callbackUrl });
    return;
  }

  // Browser-only fallback (dev without Electron)
  const popup = window.open(
    authorizeUrl,
    "mclaunch-discord-auth",
    "popup=yes,width=520,height=720,resizable=yes,scrollbars=yes",
  );
  if (!popup) {
    throw new Error("No se pudo abrir la ventana de autenticación de Discord.");
  }
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
        // online=true uses smart filter; if presence is empty backend still returns contacts.
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
        if (friendsPayload.note) {
          console.info("[discord] friends note:", friendsPayload.note, {
            source: friendsPayload.source,
            count: friendsPayload.friends.length,
          });
        }
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
        onlineCount:
          friendsPayload.onlineCount ||
          friendsPayload.friends.filter((f) => f.isOnline).length ||
          friendsPayload.friends.length,
        source: friendsPayload.source,
        note: friendsPayload.note,
        lastError: null,
      });
      if (friendsPayload.note) {
        console.info("[discord] friends note:", friendsPayload.note, {
          source: friendsPayload.source,
          count: friendsPayload.friends.length,
        });
      }
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

      // Fire-and-forget UI: openBackendLoginPopup resolves after loading Discord,
      // not after the user finishes. Polling is the source of truth.
      void openDiscordAuthInApp(session.authorizeUrl, session.callbackUrl).catch((error) => {
        console.warn("[discord] No se pudo abrir el popup in-app:", error);
      });

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
