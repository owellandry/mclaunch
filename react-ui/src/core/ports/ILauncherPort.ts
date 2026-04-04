import type { LauncherConfig, MinecraftVersion } from "../domain/launcher";

export interface ILauncherPort {
  launch(config: LauncherConfig, username: string): void;
  getVersions(): Promise<MinecraftVersion[]>;
  getWeeklyActivity(): Promise<number[]>;
  getStatistics(): Promise<{win_rate: number, kda: number}>;
  getDownloadedVersions(): Promise<string[]>;
  onLog(callback: (message: string) => void): () => void;
  onStatus(callback: (status: "idle" | "running" | "done" | "error") => void): () => void;
}
