import { contextBridge, ipcRenderer, IpcRendererEvent } from "electron";
import type { LaunchPayload } from "./ipc/launcher";

const CHANNELS = {
  launch: "launcher:launch",
  log: "launcher:log",
  status: "launcher:status",
} as const;

type LauncherStatus = "idle" | "running" | "done" | "error";

const api = {
  launchMinecraft: (config: LaunchPayload): void => {
    ipcRenderer.send(CHANNELS.launch, config);
  },
  onLauncherLog: (callback: (message: string) => void): (() => void) => {
    const listener = (_event: IpcRendererEvent, message: string): void => callback(message);
    ipcRenderer.on(CHANNELS.log, listener);
    return () => ipcRenderer.removeListener(CHANNELS.log, listener);
  },
  onLauncherStatus: (callback: (status: LauncherStatus) => void): (() => void) => {
    const listener = (_event: IpcRendererEvent, status: LauncherStatus): void => callback(status);
    ipcRenderer.on(CHANNELS.status, listener);
    return () => ipcRenderer.removeListener(CHANNELS.status, listener);
  },
};

contextBridge.exposeInMainWorld("api", api);
