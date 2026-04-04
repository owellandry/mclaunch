import { UserProfile } from "../domain/profile";
import { LauncherConfig } from "../domain/launcher";

export interface IStoragePort {
  getProfile(): UserProfile | null;
  saveProfile(profile: UserProfile): void;
  
  getLauncherConfig(): LauncherConfig | null;
  saveLauncherConfig(config: LauncherConfig): void;
}
