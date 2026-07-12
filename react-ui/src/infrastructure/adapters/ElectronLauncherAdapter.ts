import type { ILauncherPort } from "@/core/ports/ILauncherPort";
import type { ActivityDetails, DetailedMinecraftStats, LauncherConfig, MinecraftVersion, VersionCatalog } from "@/core/domain/launcher";

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
    if (window.api?.getWeeklyActivity) {
      return window.api.getWeeklyActivity();
    }
    console.warn("Electron API not found. Returning empty weekly activity");
    return Promise.resolve([0, 0, 0, 0, 0, 0, 0]);
  }

  getActivityDetails(): Promise<ActivityDetails> {
    if (window.api?.getActivityDetails) {
      return window.api.getActivityDetails();
    }
    console.warn("Electron API not found. Returning empty activity details");
    return Promise.resolve({
      entries: [],
      summary: {
        total_seconds_all_time: 0,
        total_seconds_last_30_days: 0,
        total_seconds_last_7_days: 0,
        average_seconds_last_7_days: 0,
        active_days_last_30_days: 0,
        current_streak_days: 0,
        longest_streak_days: 0,
        best_day: null,
      },
    });
  }

  getMinecraftStats(gameDir: string, uuid: string): Promise<{ mob_kills: number; deaths: number; blocks_mined: number; hours_played: number; play_seconds: number }> {
    if (window.api?.getMinecraftStats) {
      return window.api.getMinecraftStats(gameDir, uuid);
    }
    console.warn("Electron API not found. Returning empty stats");
    return Promise.resolve({ mob_kills: 0, deaths: 0, blocks_mined: 0, hours_played: 0, play_seconds: 0 });
  }

  getDetailedMinecraftStats(gameDir: string, uuid: string): Promise<DetailedMinecraftStats> {
    if (window.api?.getDetailedMinecraftStats) {
      return window.api.getDetailedMinecraftStats(gameDir, uuid);
    }
    console.warn("Electron API not found. Returning empty detailed stats");
    return Promise.resolve({
      summary: {
        mob_kills: 0,
        deaths: 0,
        blocks_mined: 0,
        hours_played: 0,
        play_seconds: 0,
        worlds_tracked: 0,
        kill_death_ratio: 0,
        blocks_per_hour: 0,
        kills_per_hour: 0,
      },
      worlds: [],
    });
  }

  getDownloadedVersions(): Promise<string[]> {
    if (window.api?.getDownloadedVersions) {
      return window.api.getDownloadedVersions();
    }
    console.warn("Electron API not found. Returning empty list");
    return Promise.resolve([]);
  }

  syncDownloadedVersions(gameDir: string): Promise<string[]> {
    if (window.api?.syncDownloadedVersions) {
      return window.api.syncDownloadedVersions(gameDir);
    }
    console.warn("Electron API not found. Returning empty list");
    return Promise.resolve([]);
  }

  getVersionCatalog(gameDir: string): Promise<VersionCatalog> {
    if (window.api?.getVersionCatalog) {
      return window.api.getVersionCatalog(gameDir);
    }
    console.warn("Electron API not found. Returning empty catalog");
    return Promise.resolve({
      summary: {
        available_versions: 0,
        downloaded_versions: 0,
        latest_downloaded_at: null,
      },
      versions: [],
    });
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
