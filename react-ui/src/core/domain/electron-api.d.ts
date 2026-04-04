export type LaunchPayload = {
  username: string;
  version: string;
  memoryMb: number;
  gameDir: string;
};

export type LauncherStatus = "idle" | "running" | "done" | "error";

export type ElectronApi = {
  launchMinecraft: (config: LaunchPayload) => void;
  onLauncherLog: (callback: (message: string) => void) => () => void;
  onLauncherStatus: (callback: (status: LauncherStatus) => void) => () => void;
};

declare global {
  interface Window {
    api: ElectronApi;
  }
}
