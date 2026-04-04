import { LauncherConfig, LauncherStatus } from "../domain/launcher";

export interface ILauncherPort {
  launch(config: LauncherConfig, username: string): void;
  onLog(callback: (message: string) => void): () => void;
  onStatus(callback: (status: LauncherStatus) => void): () => void;
}
