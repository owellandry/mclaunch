import type { ILauncherPort } from "../../core/ports/ILauncherPort";
import type { ActivityDetails, DetailedMinecraftStats, LauncherConfig, MinecraftVersion, VersionCatalog } from "../../core/domain/launcher";

export class ElectronLauncherAdapter implements ILauncherPort {
  launch(config: LauncherConfig, username: string): void {
    if (window.api && window.api.launchMinecraft) {
      window.api.launchMinecraft({
        username,
        version: config.version,
        memoryMb: config.memoryMb,
        gameDir: config.gameDir,
      });
    } else {
      console.warn("Electron API not found. Mock launch:", { config, username });
    }
  }

  async getVersions(): Promise<MinecraftVersion[]> {
    if (window.api && window.api.getVersions) {
      return await window.api.getVersions();
    }
    console.warn("Electron API not found. Returning mock versions");
    return [
      { id: "1.20.1", type: "release", url: "", time: "", releaseTime: "" },
      { id: "1.19.4", type: "release", url: "", time: "", releaseTime: "" }
    ];
  }

  getWeeklyActivity(): Promise<number[]> {
    return window.api.getWeeklyActivity();
  }

  getActivityDetails(): Promise<ActivityDetails> {
    return window.api.getActivityDetails();
  }

  getMinecraftStats(gameDir: string, uuid: string): Promise<{ mob_kills: number; deaths: number; blocks_mined: number; hours_played: number; play_seconds: number }> {
    return window.api.getMinecraftStats(gameDir, uuid);
  }

  getDetailedMinecraftStats(gameDir: string, uuid: string): Promise<DetailedMinecraftStats> {
    return window.api.getDetailedMinecraftStats(gameDir, uuid);
  }

  getDownloadedVersions(): Promise<string[]> {
    return window.api.getDownloadedVersions();
  }

  syncDownloadedVersions(gameDir: string): Promise<string[]> {
    return window.api.syncDownloadedVersions(gameDir);
  }

  getVersionCatalog(gameDir: string): Promise<VersionCatalog> {
    return window.api.getVersionCatalog(gameDir);
  }

  onLog(callback: (message: string) => void): () => void {
    if (window.api && window.api.onLauncherLog) {
      return window.api.onLauncherLog(callback);
    }
    return () => {};
  }

  onProgress(callback: (progress: { type: string; task: number; total: number }) => void): () => void {
    if (window.api && window.api.onLauncherProgress) {
      return window.api.onLauncherProgress(callback);
    }
    return () => {};
  }

  onStatus(callback: (status: "idle" | "running" | "playing" | "done" | "error") => void): () => void {
    if (window.api && window.api.onLauncherStatus) {
      return window.api.onLauncherStatus(callback);
    }
    return () => {};
  }
}
