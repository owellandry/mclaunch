import type { LauncherConfig, LauncherStatus, MinecraftVersion } from "../domain/launcher";

export interface ILauncherPort {
  launch(config: LauncherConfig, username: string): void;
  getVersions(): Promise<MinecraftVersion[]>;
  onLog(callback: (message: string) => void): () => void;
  onStatus(callback: (status: LauncherStatus) => void): () => void;
}
