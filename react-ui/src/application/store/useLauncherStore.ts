import { create } from "zustand";
import { LauncherStatus } from "../../core/domain/launcher";
import { ElectronLauncherAdapter } from "../../infrastructure/adapters/ElectronLauncherAdapter";
import { useAppStore } from "./useAppStore";

interface LauncherState {
  status: LauncherStatus;
  logs: string[];
  selectedInstallId: string;
  setStatus: (status: LauncherStatus) => void;
  addLog: (log: string) => void;
  clearLogs: () => void;
  setSelectedInstallId: (id: string) => void;
  launch: () => void;
  initListeners: () => () => void;
}

const launcherAdapter = new ElectronLauncherAdapter();

export const useLauncherStore = create<LauncherState>((set, get) => ({
  status: "idle",
  logs: [],
  selectedInstallId: "aurora", // default
  setStatus: (status) => set({ status }),
  addLog: (log) => set((state) => ({ logs: [...state.logs, log] })),
  clearLogs: () => set({ logs: [] }),
  setSelectedInstallId: (id) => set({ selectedInstallId: id }),
  
  launch: () => {
    const { profile, config } = useAppStore.getState();
    const { status, selectedInstallId, addLog, setStatus } = get();

    if (!profile || profile.username.trim().length < 3 || status === "running") {
      return;
    }

    addLog(`[launcher] Perfil cargado: ${profile.username.trim()}`);
    addLog(`[launcher] Memoria reservada: ${config.memoryMb} MB`);
    setStatus("running");

    launcherAdapter.launch(config, profile.username.trim());
  },

  initListeners: () => {
    const unsubLog = launcherAdapter.onLog((message) => {
      get().addLog(message);
    });
    const unsubStatus = launcherAdapter.onStatus((status) => {
      get().setStatus(status);
    });

    return () => {
      unsubLog();
      unsubStatus();
    };
  }
}));
