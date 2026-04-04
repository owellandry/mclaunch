export type LauncherStatus = "idle" | "running" | "playing" | "done" | "error";

export type LauncherConfig = {
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

export type InstallationCard = {
  id: string;
  label: string;
  channel: string;
  vibe: string;
  description: string;
};
