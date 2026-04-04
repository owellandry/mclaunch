export type LauncherStatus = "idle" | "running" | "done" | "error";

export type LauncherConfig = {
  username: string;
  version: string;
  memoryMb: number;
  gameDir: string;
};
