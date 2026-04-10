/// <reference types="vite/client" />

type InstallerPlatform = "windows" | "linux" | "macos";
type InstallerArch = "x64" | "arm64" | "universal";

type InstallerSystemProfile = {
  platform: InstallerPlatform;
  arch: InstallerArch;
  version: string;
  osVersion: string;
  tempDir: string;
  homeDir: string;
};

type InstallerUiEvent =
  | {
      type: "state";
      phase: "detect" | "resolve" | "download" | "install" | "verify";
      progress: number;
      message: string;
    }
  | {
      type: "log";
      level: "info" | "warn" | "error";
      message: string;
    }
  | {
      type: "done";
      progress: 100;
      message: string;
      releaseTag: string;
      assetName: string;
      installPath: string;
      platform: InstallerPlatform;
      arch: InstallerArch;
    }
  | {
      type: "error";
      message: string;
    };

type InstallState =
  | { status: "idle" }
  | {
      status: "running";
      phase: "detect" | "resolve" | "download" | "install" | "verify";
      progress: number;
      message: string;
    }
  | {
      status: "done";
      releaseTag: string;
      assetName: string;
      installPath: string;
      platform: InstallerPlatform;
      arch: InstallerArch;
    }
  | {
      status: "error";
      message: string;
    };

interface Window {
  installerApi?: {
    getPlatform: () => Promise<InstallerSystemProfile>;
    getInstallState: () => Promise<InstallState>;
    startInstall: () => Promise<InstallState>;
    launchApp: () => Promise<boolean>;
    onInstallerEvent: (callback: (event: InstallerUiEvent) => void) => () => void;
    minimizeWindow: () => void;
    maximizeWindow: () => void;
    closeWindow: () => void;
  };
}
