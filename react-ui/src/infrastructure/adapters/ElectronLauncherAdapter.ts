import type { ILauncherPort } from "../../core/ports/ILauncherPort";
import type { LauncherConfig, LauncherStatus } from "../../core/domain/launcher";

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
