import type { UserProfile } from "@/core/domain/profile";
import type { LauncherConfig } from "@/core/domain/launcher";

export interface IStoragePort {
  getProfile(): UserProfile | null;
  saveProfile(profile: UserProfile): void;
  getBackendAccessToken(): string | null;
  saveBackendAccessToken(token: string): void;
  clearBackendAccessToken(): void;
  getLauncherConfig(): LauncherConfig | null;
  saveLauncherConfig(config: LauncherConfig): void;
  clearAll?(): void;
}
