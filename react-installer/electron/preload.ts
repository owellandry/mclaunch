import { contextBridge, ipcRenderer } from "electron";
import type { InstallState, InstallerUiEvent, SystemProfile } from "./installerRuntime";

contextBridge.exposeInMainWorld("installerApi", {
  getPlatform: () => ipcRenderer.invoke("installer:get-platform") as Promise<SystemProfile>,
  getInstallState: () => ipcRenderer.invoke("installer:get-state") as Promise<InstallState>,
  startInstall: () => ipcRenderer.invoke("installer:start-install") as Promise<InstallState>,
  launchApp: () => ipcRenderer.invoke("installer:launch-app") as Promise<boolean>,
  onInstallerEvent: (callback: (event: InstallerUiEvent) => void): (() => void) => {
    const listener = (_event: unknown, payload: InstallerUiEvent): void => callback(payload);
    ipcRenderer.on("installer:event", listener);
    return () => ipcRenderer.removeListener("installer:event", listener);
  },
  minimizeWindow: (): void => ipcRenderer.send("window:minimize"),
  maximizeWindow: (): void => ipcRenderer.send("window:maximize"),
  closeWindow: (): void => ipcRenderer.send("window:close"),
});
