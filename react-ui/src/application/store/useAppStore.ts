import { create } from "zustand";
import type { UserProfile } from "../../core/domain/profile";
import type { LauncherConfig } from "../../core/domain/launcher";
import { LocalStorageAdapter } from "../../infrastructure/adapters/LocalStorageAdapter";

interface AppState {
  profile: UserProfile | null;
  config: LauncherConfig;
  searchQuery: string;
  logo: string;
  setProfile: (profile: UserProfile) => void;
  setConfig: (config: LauncherConfig) => void;
  completeOnboarding: (username: string, memoryMb: number, gameDir: string) => void;
  setSearchQuery: (query: string) => void;
  setLogo: (logo: string) => void;
  fetchLogo: () => Promise<void>;
  clearAll: () => void;
}

const storage = new LocalStorageAdapter();

const DEFAULT_CONFIG: LauncherConfig = {
  version: "1.20.1",
  memoryMb: 4096,
  gameDir: "C:\\Users\\Public\\Games\\.minecraft",
};

export const useAppStore = create<AppState>((set, get) => {
  const initialProfile = storage.getProfile();
  const initialConfig = storage.getLauncherConfig() || DEFAULT_CONFIG;

  return {
    profile: initialProfile,
    config: initialConfig,
    searchQuery: "",
    logo: "logo_gren.svg",
    setProfile: (profile) => {
      storage.saveProfile(profile);
      set({ profile });
    },
    setConfig: (config) => {
      storage.saveLauncherConfig(config);
      set({ config });
    },
    completeOnboarding: (username, memoryMb, gameDir) => {
      const newProfile: UserProfile = { username, isOnboardingCompleted: true };
      const newConfig: LauncherConfig = { ...get().config, memoryMb, gameDir };
      storage.saveProfile(newProfile);
      storage.saveLauncherConfig(newConfig);
      set({ profile: newProfile, config: newConfig });
    },
    setSearchQuery: (query) => set({ searchQuery: query }),
    setLogo: (logo: string) => {
      set({ logo });
      if (window.api && window.api.setLogo) {
        window.api.setLogo(logo);
      }
    },
    fetchLogo: async () => {
      if (window.api && window.api.getLogo) {
        const logo = await window.api.getLogo();
        set({ logo });
      }
    },
    clearAll: () => {
      storage.clearAll?.();
      set({ profile: null, config: initialConfig, searchQuery: "", logo: "logo_gren.svg" });
    }
  };
});
