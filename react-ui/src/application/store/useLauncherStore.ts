/**
 * @file useLauncherStore.ts
 * @description Store del motor del launcher. Interactúa con IPC para descargar, lanzar Minecraft y reportar progreso.
 * 
 * Patrón: Atomic Design
 */
import { create } from "zustand";
import type { LauncherStatus, MinecraftVersion } from "../../core/domain/launcher";
import { ElectronLauncherAdapter } from "../../infrastructure/adapters/ElectronLauncherAdapter";
import { contentApi } from "../../infrastructure/api/contentApi";
import type { BackendBanner } from "../../infrastructure/api/backendClient";
import { useAppStore } from "./useAppStore";
import { useNotificationStore } from "./useNotificationStore";

interface LauncherState {
  status: LauncherStatus;
  logs: string[];
  progress: { type: string; task: number; total: number; percentage: number } | null;
  availableVersions: MinecraftVersion[];
  downloadedVersions: string[];
  launchedVersionWasDownloaded: boolean;
  weeklyActivity: number[];
  statistics: { win_rate: number; kda: number };
  homeBanners: BackendBanner[];
  setStatus: (status: LauncherStatus) => void;
  addLog: (log: string) => void;
  clearLogs: () => void;
  fetchVersions: () => Promise<void>;
  fetchDbData: () => Promise<void>;
  fetchHomeBanners: () => Promise<void>;
  hydrateDashboard: (force?: boolean) => Promise<void>;
  launch: () => void;
  initListeners: () => () => void;
}

const launcherAdapter = new ElectronLauncherAdapter();
const MAX_LOG_ENTRIES = 200;
const DASHBOARD_HYDRATE_TTL_MS = 30_000;

let dashboardHydrationPromise: Promise<void> | null = null;
let lastHydratedAt = 0;
let lastHydratedGameDir = "";

export const useLauncherStore = create<LauncherState>((set, get) => ({
  status: "idle",
  logs: [],
  progress: null,
  availableVersions: [],
  downloadedVersions: [],
  launchedVersionWasDownloaded: false,
  weeklyActivity: [0, 0, 0, 0, 0, 0, 0],
  statistics: { win_rate: 0, kda: 0 },
  homeBanners: [],
  setStatus: (status) => set({ status }),
  addLog: (log) =>
    set((state) => ({
      logs:
        state.logs.length >= MAX_LOG_ENTRIES
          ? [...state.logs.slice(-(MAX_LOG_ENTRIES - 1)), log]
          : [...state.logs, log],
    })),
  clearLogs: () => set({ logs: [] }),
  fetchVersions: async () => {
    try {
      const versions = await launcherAdapter.getVersions();
      set({ availableVersions: versions });
    } catch (e) {
      console.error(e);
      throw e;
    }
  },
  fetchDbData: async () => {
    try {
      const { config } = useAppStore.getState();
      const [weeklyActivity, statistics, downloadedVersions] = await Promise.all([
        launcherAdapter.getWeeklyActivity(),
        launcherAdapter.getStatistics(),
        launcherAdapter.syncDownloadedVersions(config.gameDir),
      ]);
      set({ weeklyActivity, statistics, downloadedVersions });
    } catch (e) {
      console.error(e);
      throw e;
    }
  },
  fetchHomeBanners: async () => {
    try {
      const homeBanners = await contentApi.getHomeBanners();
      set({ homeBanners });
    } catch (e) {
      console.error(e);
      set({ homeBanners: [] });
    }
  },
  hydrateDashboard: async (force = false) => {
    const { gameDir } = useAppStore.getState().config;
    const now = Date.now();

    if (!force && dashboardHydrationPromise) {
      return dashboardHydrationPromise;
    }

    if (!force && lastHydratedGameDir === gameDir && now - lastHydratedAt < DASHBOARD_HYDRATE_TTL_MS) {
      return;
    }

    dashboardHydrationPromise = Promise.all([get().fetchVersions(), get().fetchDbData(), get().fetchHomeBanners()])
      .then(() => {
        lastHydratedAt = Date.now();
        lastHydratedGameDir = gameDir;
      })
      .finally(() => {
        dashboardHydrationPromise = null;
      });

    return dashboardHydrationPromise;
  },

  launch: () => {
    const { profile, config } = useAppStore.getState();
    const { status, addLog, setStatus, downloadedVersions } = get();

    if (!profile || profile.username.trim().length < 3 || status === "running") {
      return;
    }

    const version = config.version || "1.20.1";
    const wasDownloaded = downloadedVersions.includes(version);

    addLog(`[launcher] Perfil cargado: ${profile.username.trim()}`);
    addLog(`[launcher] Memoria reservada: ${config.memoryMb} MB`);
    setStatus("running");
    set({ progress: null, launchedVersionWasDownloaded: wasDownloaded });

    launcherAdapter.launch(config, profile.username.trim());
  },

  initListeners: () => {
    const unsubLog = launcherAdapter.onLog((message) => {
      get().addLog(message);
      
      // Dispatch specific notifications based on log messages
      const addNotif = useNotificationStore.getState().addNotification;
      const lowerMsg = message.toLowerCase();
      
      // Avoid spamming notifications for every progress/download log
      if (lowerMsg.startsWith("preparando lanzamiento offline")) {
        addNotif("Preparando juego", "Verificando recursos e iniciando launcher...", "info");
      }
      if (lowerMsg.includes("iniciando versión")) {
        addNotif("Lanzando Minecraft", "El juego está a punto de abrirse.", "info");
      }
      if (lowerMsg === "juego iniciado.") {
        addNotif("¡Minecraft Abierto!", "Disfruta de tu partida.", "success");
      }
      if (lowerMsg.startsWith("error en lanzamiento") || lowerMsg.startsWith("error:")) {
        addNotif("Error de lanzamiento", message, "error");
      }
    });

    const unsubProgress = launcherAdapter.onProgress((prog) => {
      const percentage = prog.total > 0 ? Math.round((prog.task / prog.total) * 100) : 0;
      set({ progress: { ...prog, percentage } });
    });

    const unsubStatus = launcherAdapter.onStatus((status) => {
      const prevStatus = get().status;
      get().setStatus(status);
      
      const addNotif = useNotificationStore.getState().addNotification;
      if (status === "done" && (prevStatus === "running" || prevStatus === "playing")) {
        addNotif("Juego Cerrado", "La sesión de Minecraft ha finalizado.", "info");
      }
      if (status === "error") {
        addNotif("Error Crítico", "El launcher experimentó un error inesperado.", "error");
      }

      if (status === "done" || status === "idle" || status === "error") {
        lastHydratedAt = 0;
        void get().fetchDbData().catch((error) => {
          console.error("No se pudo refrescar la data del launcher tras cambiar el estado.", error);
        });
        // Reset to idle so the button is re-enabled for the next launch
        setTimeout(() => get().setStatus("idle"), 500);
      }
    });

    return () => {
      unsubLog();
      unsubProgress();
      unsubStatus();
    };
  }
}));
