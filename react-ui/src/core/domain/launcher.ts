export type LauncherStatus = "idle" | "running" | "done" | "error";

export type LauncherConfig = {
  version: string;
  memoryMb: number;
  gameDir: string;
};

export type InstallationCard = {
  id: string;
  label: string;
  channel: string;
  vibe: string;
  description: string;
};
