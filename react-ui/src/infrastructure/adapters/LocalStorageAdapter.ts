import type { IStoragePort } from "../../core/ports/IStoragePort";
import type { UserProfile } from "../../core/domain/profile";
import type { LauncherConfig } from "../../core/domain/launcher";

const PROFILE_KEY = "nebula_profile";
const CONFIG_KEY = "nebula_launcher_config";
const BACKEND_ACCESS_TOKEN_KEY = "nebula_backend_access_token";

export class LocalStorageAdapter implements IStoragePort {
  getProfile(): UserProfile | null {
    const data = localStorage.getItem(PROFILE_KEY);
    return data ? JSON.parse(data) : null;
  }

  saveProfile(profile: UserProfile): void {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  }

  getBackendAccessToken(): string | null {
    return localStorage.getItem(BACKEND_ACCESS_TOKEN_KEY);
  }

  saveBackendAccessToken(token: string): void {
    localStorage.setItem(BACKEND_ACCESS_TOKEN_KEY, token);
  }

  clearBackendAccessToken(): void {
    localStorage.removeItem(BACKEND_ACCESS_TOKEN_KEY);
  }

  getLauncherConfig(): LauncherConfig | null {
    const data = localStorage.getItem(CONFIG_KEY);
    return data ? JSON.parse(data) : null;
  }

  saveLauncherConfig(config: LauncherConfig): void {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
  }

  clearAll(): void {
    localStorage.removeItem(PROFILE_KEY);
    localStorage.removeItem(CONFIG_KEY);
    localStorage.removeItem(BACKEND_ACCESS_TOKEN_KEY);
  }
}
