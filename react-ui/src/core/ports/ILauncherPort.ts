import type { ActivityDetails, DetailedMinecraftStats, LauncherConfig, MinecraftVersion, VersionCatalog } from "../domain/launcher";

export interface ILauncherPort {
  launch(config: LauncherConfig, username: string): void;
  getVersions(): Promise<MinecraftVersion[]>;
  getWeeklyActivity(): Promise<number[]>;
  getActivityDetails(): Promise<ActivityDetails>;
  getMinecraftStats(gameDir: string, uuid: string): Promise<{ mob_kills: number; deaths: number; blocks_mined: number; hours_played: number; play_seconds: number }>;
  getDetailedMinecraftStats(gameDir: string, uuid: string): Promise<DetailedMinecraftStats>;
  getDownloadedVersions(): Promise<string[]>;
  syncDownloadedVersions(gameDir: string): Promise<string[]>;
  getVersionCatalog(gameDir: string): Promise<VersionCatalog>;
  onLog(callback: (message: string) => void): () => void;
  onProgress(callback: (progress: { type: string; task: number; total: number }) => void): () => void;
  onStatus(callback: (status: "idle" | "running" | "playing" | "done" | "error") => void): () => void;
}
