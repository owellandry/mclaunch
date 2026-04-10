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
    hours_played: number;
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

export type LauncherStatus = "idle" | "running" | "playing" | "done" | "error";

export type ElectronApi = {
  launchMinecraft: (config: LaunchPayload) => void;
  getVersions: () => Promise<MinecraftVersion[]>;
  getWeeklyActivity: () => Promise<number[]>;
  getActivityDetails: () => Promise<ActivityDetails>;
  getMinecraftStats: (gameDir: string, uuid: string) => Promise<{ mob_kills: number; deaths: number; blocks_mined: number; hours_played: number; play_seconds: number }>;
  getDetailedMinecraftStats: (gameDir: string, uuid: string) => Promise<DetailedMinecraftStats>;
  getDownloadedVersions: () => Promise<string[]>;
  syncDownloadedVersions: (gameDir: string) => Promise<string[]>;
  getVersionCatalog: (gameDir: string) => Promise<VersionCatalog>;
  getLogo: () => Promise<string>;
  setLogo: (logo: string) => void;
  getLanguage: () => Promise<string>;
  setLanguage: (lang: string) => void;
  loginMicrosoft: () => Promise<{username: string, uuid: string, skinUrl?: string | null, isOnboardingCompleted: boolean, backendAccessToken?: string | null}>;
  openBackendLoginPopup: (payload: { authorizeUrl: string; callbackUrl: string }) => Promise<boolean>;
  setBackendAuthSession: (payload: {
    msmcToken: string;
    mclcAuth: unknown;
    profile: unknown;
  }) => Promise<{username: string, uuid: string, skinUrl?: string | null, isOnboardingCompleted: boolean}>;
  logoutMicrosoft: () => Promise<boolean>;
  getProfile: () => Promise<{username: string, uuid: string, skinUrl?: string | null, isOnboardingCompleted: boolean} | null>;
  clearCache: () => Promise<void>;
  clearAllData: () => Promise<void>;
  restartApp: () => void;
  getApiBaseUrl: () => string;
  openExternal: (url: string) => Promise<void>;
  minimizeWindow: () => void;
  maximizeWindow: () => void;
  closeWindow: () => void;
  onLauncherLog: (callback: (message: string) => void) => () => void;
  onLauncherProgress: (callback: (progress: { type: string; task: number; total: number }) => void) => () => void;
  onLauncherStatus: (callback: (status: LauncherStatus) => void) => () => void;
};

declare global {
  interface Window {
    api: ElectronApi;
  }
}
