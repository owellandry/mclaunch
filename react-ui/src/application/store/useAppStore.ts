import { create } from "zustand";
import type { UserProfile } from "../../core/domain/profile";
import type { LauncherConfig } from "../../core/domain/launcher";
import { LocalStorageAdapter } from "../../infrastructure/adapters/LocalStorageAdapter";

interface AppState {
  profile: UserProfile | null;
  config: LauncherConfig;
  searchQuery: string;
  logo: string;
  language: string;
  setProfile: (profile: UserProfile) => void;
  loginMicrosoft: () => Promise<void>;
  logoutMicrosoft: () => Promise<void>;
  checkAuth: () => Promise<void>;
  setConfig: (config: LauncherConfig) => void;
  completeOnboarding: (username: string, memoryMb: number, gameDir: string) => void;
  setSearchQuery: (query: string) => void;
  setLogo: (logo: string) => void;
  fetchLogo: () => Promise<void>;
  setLanguage: (lang: string) => void;
  fetchLanguage: () => Promise<void>;
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
    language: "es",
    setProfile: (profile) => {
      storage.saveProfile(profile);
      set({ profile });
    },
    loginMicrosoft: async () => {
      if (window.api && window.api.loginMicrosoft) {
        const authData = await window.api.loginMicrosoft();
        const newProfile: UserProfile = {
          username: authData.username,
          uuid: authData.uuid,
          skinUrl: authData.skinUrl ?? null,
          isOnboardingCompleted: true
        };
        storage.saveProfile(newProfile);
        set({ profile: newProfile });
      }
    },
    logoutMicrosoft: async () => {
      if (window.api && window.api.logoutMicrosoft) {
        await window.api.logoutMicrosoft();
        storage.clearAll?.();
        set({ profile: null });
      }
    },
    checkAuth: async () => {
      if (window.api && window.api.getProfile) {
        const p = await window.api.getProfile();
        if (p) {
          const profile: UserProfile = {
            username: p.username,
            uuid: p.uuid,
            skinUrl: p.skinUrl ?? null,
            isOnboardingCompleted: p.isOnboardingCompleted
          };
          storage.saveProfile(profile);
          set({ profile });
          return;
        }

        storage.clearAll?.();
        set({ profile: null });
      }
    },
    setConfig: (config) => {
      storage.saveLauncherConfig(config);
      set({ config });
    },
    completeOnboarding: (username, memoryMb, gameDir) => {
      const currentProfile = get().profile;
      const newProfile: UserProfile = {
        ...currentProfile,
        username,
        isOnboardingCompleted: true
      };
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
    setLanguage: (language: string) => {
      set({ language });
      if (window.api && window.api.setLanguage) {
        window.api.setLanguage(language);
      }
    },
    fetchLanguage: async () => {
      if (window.api && window.api.getLanguage) {
        const language = await window.api.getLanguage();
        set({ language });
      }
    },
    clearAll: () => {
      storage.clearAll?.();
      set({ profile: null, config: initialConfig, searchQuery: "", logo: "logo_gren.svg", language: "es" });
    }
  };
});
