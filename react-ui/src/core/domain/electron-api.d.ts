export type LaunchPayload = {
  username: string;
  version: string;
  memoryMb: number;
  gameDir: string;
};

export type MinecraftVersion = {
  id: string;
  type: string;
  url: string;
  time: string;
  releaseTime: string;
};

export type LauncherStatus = "idle" | "running" | "done" | "error";

export type ElectronApi = {
  launchMinecraft: (config: LaunchPayload) => void;
  getVersions: () => Promise<MinecraftVersion[]>;
  onLauncherLog: (callback: (message: string) => void) => () => void;
  onLauncherStatus: (callback: (status: LauncherStatus) => void) => () => void;
};

declare global {
  interface Window {
    api: ElectronApi;
  }
}
