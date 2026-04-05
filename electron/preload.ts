import { contextBridge, ipcRenderer, IpcRendererEvent } from "electron";
import type { LaunchPayload, MinecraftVersion } from "./ipc/launcher";

const CHANNELS = {
  launch: "launcher:launch",
  log: "launcher:log",
  progress: "launcher:progress",
  status: "launcher:status",
  getVersions: "launcher:getVersions",
  getWeeklyActivity: "db:getWeeklyActivity",
  getStatistics: "db:getStatistics",
  getDownloadedVersions: "db:getDownloadedVersions",
  clearCache: "app:clearCache",
  clearAllData: "app:clearAllData",
  restartApp: "app:restartApp"
} as const;

type LauncherStatus = "idle" | "running" | "playing" | "done" | "error";

const api = {
  launchMinecraft: (config: LaunchPayload): void => {
    ipcRenderer.send(CHANNELS.launch, config);
  },
  getVersions: (): Promise<MinecraftVersion[]> => {
    return ipcRenderer.invoke(CHANNELS.getVersions);
  },
  getWeeklyActivity: (): Promise<number[]> => {
    return ipcRenderer.invoke(CHANNELS.getWeeklyActivity);
  },
  getStatistics: (): Promise<{win_rate: number, kda: number}> => {
    return ipcRenderer.invoke(CHANNELS.getStatistics);
  },
  getDownloadedVersions: (): Promise<string[]> => {
    return ipcRenderer.invoke(CHANNELS.getDownloadedVersions);
  },
  clearCache: (): Promise<void> => {
    return ipcRenderer.invoke(CHANNELS.clearCache);
  },
  clearAllData: (): Promise<void> => {
    return ipcRenderer.invoke(CHANNELS.clearAllData);
  },
  restartApp: (): void => {
    ipcRenderer.send(CHANNELS.restartApp);
  },
  minimizeWindow: (): void => ipcRenderer.send("window:minimize"),
  maximizeWindow: (): void => ipcRenderer.send("window:maximize"),
  closeWindow: (): void => ipcRenderer.send("window:close"),
  onLauncherLog: (callback: (message: string) => void): (() => void) => {
    const listener = (_event: IpcRendererEvent, message: string): void => callback(message);
    ipcRenderer.on(CHANNELS.log, listener);
    return () => ipcRenderer.removeListener(CHANNELS.log, listener);
  },
  onLauncherProgress: (callback: (progress: { type: string; task: number; total: number }) => void): (() => void) => {
    const listener = (_event: IpcRendererEvent, progress: { type: string; task: number; total: number }): void => callback(progress);
    ipcRenderer.on(CHANNELS.progress, listener);
    return () => ipcRenderer.removeListener(CHANNELS.progress, listener);
  },
  onLauncherStatus: (callback: (status: LauncherStatus) => void): (() => void) => {
    const listener = (_event: IpcRendererEvent, status: LauncherStatus): void => callback(status);
    ipcRenderer.on(CHANNELS.status, listener);
    return () => ipcRenderer.removeListener(CHANNELS.status, listener);
  },
};

contextBridge.exposeInMainWorld("api", api);
