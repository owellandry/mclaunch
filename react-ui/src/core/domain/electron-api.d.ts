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

export type LauncherStatus = "idle" | "running" | "playing" | "done" | "error";

export type ElectronApi = {
  launchMinecraft: (config: LaunchPayload) => void;
  getVersions: () => Promise<MinecraftVersion[]>;
  getWeeklyActivity: () => Promise<number[]>;
  getStatistics: () => Promise<{win_rate: number, kda: number}>;
  getDownloadedVersions: () => Promise<string[]>;
  syncDownloadedVersions: (gameDir: string) => Promise<string[]>;
  getLogo: () => Promise<string>;
  setLogo: (logo: string) => void;
  getLanguage: () => Promise<string>;
  setLanguage: (lang: string) => void;
  loginMicrosoft: () => Promise<{username: string, uuid: string, skinUrl?: string | null, isOnboardingCompleted: boolean}>;
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
