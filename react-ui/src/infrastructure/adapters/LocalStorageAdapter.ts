import { IStoragePort } from "../../core/ports/IStoragePort";
import { UserProfile } from "../../core/domain/profile";
import { LauncherConfig } from "../../core/domain/launcher";

const PROFILE_KEY = "nebula_profile";
const CONFIG_KEY = "nebula_launcher_config";

export class LocalStorageAdapter implements IStoragePort {
  getProfile(): UserProfile | null {
    const data = localStorage.getItem(PROFILE_KEY);
    return data ? JSON.parse(data) : null;
  }

  saveProfile(profile: UserProfile): void {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  }

  getLauncherConfig(): LauncherConfig | null {
    const data = localStorage.getItem(CONFIG_KEY);
    return data ? JSON.parse(data) : null;
  }

  saveLauncherConfig(config: LauncherConfig): void {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
  }
}
