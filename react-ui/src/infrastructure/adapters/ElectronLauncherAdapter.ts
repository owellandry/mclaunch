import type { ILauncherPort } from "../../core/ports/ILauncherPort";
import type { LauncherConfig, LauncherStatus, MinecraftVersion } from "../../core/domain/launcher";

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

  onLog(callback: (message: string) => void): () => void {
    if (window.api && window.api.onLauncherLog) {
      return window.api.onLauncherLog(callback);
    }
    return () => {};
  }

  onStatus(callback: (status: LauncherStatus) => void): () => void {
    if (window.api && window.api.onLauncherStatus) {
      return window.api.onLauncherStatus(callback);
    }
    return () => {};
  }
}
