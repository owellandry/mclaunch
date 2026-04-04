import { create } from "zustand";
import type { LauncherStatus, MinecraftVersion } from "../../core/domain/launcher";
import { ElectronLauncherAdapter } from "../../infrastructure/adapters/ElectronLauncherAdapter";
import { useAppStore } from "./useAppStore";
import { useNotificationStore } from "./useNotificationStore";

interface LauncherState {
  status: LauncherStatus;
  logs: string[];
  availableVersions: MinecraftVersion[];
  downloadedVersions: string[];
  weeklyActivity: number[];
  statistics: { win_rate: number; kda: number };
  setStatus: (status: LauncherStatus) => void;
  addLog: (log: string) => void;
  clearLogs: () => void;
  fetchVersions: () => Promise<void>;
  fetchDbData: () => Promise<void>;
  launch: () => void;
  initListeners: () => () => void;
}

const launcherAdapter = new ElectronLauncherAdapter();

export const useLauncherStore = create<LauncherState>((set, get) => ({
  status: "idle",
  logs: [],
  availableVersions: [],
  downloadedVersions: [],
  weeklyActivity: [0, 0, 0, 0, 0, 0, 0],
  statistics: { win_rate: 0, kda: 0 },
  setStatus: (status) => set({ status }),
  addLog: (log) => set((state) => ({ logs: [...state.logs, log] })),
  clearLogs: () => set({ logs: [] }),
  fetchVersions: async () => {
    try {
      const versions = await launcherAdapter.getVersions();
      set({ availableVersions: versions });
    } catch (e) {
      console.error(e);
    }
  },
  fetchDbData: async () => {
    try {
      const weeklyActivity = await launcherAdapter.getWeeklyActivity();
      const statistics = await launcherAdapter.getStatistics();
      const downloadedVersions = await launcherAdapter.getDownloadedVersions();
      set({ weeklyActivity, statistics, downloadedVersions });
    } catch (e) {
      console.error(e);
    }
  },

  launch: () => {
    const { profile, config } = useAppStore.getState();
    const { status, addLog, setStatus } = get();

    if (!profile || profile.username.trim().length < 3 || status === "running") {
      return;
    }

    addLog(`[launcher] Perfil cargado: ${profile.username.trim()}`);
    addLog(`[launcher] Memoria reservada: ${config.memoryMb} MB`);
    setStatus("running");

    launcherAdapter.launch(config, profile.username.trim());
  },

  initListeners: () => {
    get().fetchDbData();
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
      if (lowerMsg.startsWith("error en lanzamiento")) {
        addNotif("Error de lanzamiento", message, "error");
      }
    });

    const unsubStatus = launcherAdapter.onStatus((status) => {
      const prevStatus = get().status;
      get().setStatus(status);
      
      const addNotif = useNotificationStore.getState().addNotification;
      if (status === "done" && prevStatus === "running") {
        addNotif("Juego Cerrado", "La sesión de Minecraft ha finalizado.", "info");
      }
      if (status === "error") {
        addNotif("Error Crítico", "El launcher experimentó un error inesperado.", "error");
      }

      if (status === "done" || status === "idle" || status === "error") {
        get().fetchDbData();
      }
    });

    return () => {
      unsubLog();
      unsubStatus();
    };
  }
}));
