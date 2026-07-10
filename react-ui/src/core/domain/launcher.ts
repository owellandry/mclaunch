/**
 * @file launcher.ts
 * @description Tipos, interfaces y helpers del dominio del launcher Minecraft.
 *
 * Patrón: Atomic Design — Core / Domain
 */

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

export type ActivityDetails = {
  entries: Array<{
    date: string;
    playTime: number;
  }>;
  summary: {
    total_seconds_all_time: number;
    total_seconds_last_30_days: number;
    total_seconds_last_7_days: number;
    average_seconds_last_7_days: number;
    active_days_last_30_days: number;
    current_streak_days: number;
    longest_streak_days: number;
    best_day: {
      date: string;
      playTime: number;
    } | null;
  };
};

export type DetailedMinecraftStats = {
  summary: {
    mob_kills: number;
    deaths: number;
    blocks_mined: number;
    hours_played: number;
    play_seconds: number;
    worlds_tracked: number;
    kill_death_ratio: number;
    blocks_per_hour: number;
    kills_per_hour: number;
  };
  worlds: Array<{
    world_name: string;
    mob_kills: number;
    deaths: number;
    blocks_mined: number;
    play_seconds: number;
    last_played_at: string | null;
  }>;
};

export type VersionCatalog = {
  summary: {
    available_versions: number;
    downloaded_versions: number;
    latest_downloaded_at: string | null;
  };
  versions: Array<
    MinecraftVersion & {
      installed: boolean;
      installedAt: string | null;
    }
  >;
};

export type InstallationCard = {
  id: string;
  label: string;
  channel: string;
  vibe: string;
  description: string;
};

/** Fallback razonable si el catálogo de versiones está vacío. */
const FALLBACK_VERSION = "1.21.5";

/**
 * Retorna la versión "release" más reciente del catálogo.
 * Útil para reemplazar el quemado "1.20.1" que había antes.
 */
export function getLatestRelease(
  versions: MinecraftVersion[],
  fallback = FALLBACK_VERSION,
): string {
  const releases = versions
    .filter((v) => v.type === "release")
    .sort(
      (a, b) =>
        new Date(b.releaseTime).getTime() - new Date(a.releaseTime).getTime(),
    );

  return releases.length > 0 ? releases[0].id : fallback;
}
