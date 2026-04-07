/**
 * @file useAppStore.ts
 * @description Store global de la aplicación. Maneja estado de configuración (RAM, dir), perfil, personalización (logo, idioma) y auth de MSMC.
 * 
 * Patrón: Atomic Design
 */
import { create } from "zustand";
import type { UserProfile } from "../../core/domain/profile";
import type { LauncherConfig } from "../../core/domain/launcher";
import { LocalStorageAdapter } from "../../infrastructure/adapters/LocalStorageAdapter";
import { authApi } from "../../infrastructure/api/authApi";
import type { BackendAccount } from "../../infrastructure/api/backendClient";

interface AppState {
  profile: UserProfile | null;
  backendAccessToken: string | null;
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

const mapAccountToProfile = (account: BackendAccount): UserProfile => ({
  username: account.displayName,
  uuid: account.uuid ?? undefined,
  skinUrl: account.skinUrl ?? null,
  isOnboardingCompleted: true,
});

const DEFAULT_CONFIG: LauncherConfig = {
  version: "1.20.1",
  memoryMb: 4096,
  gameDir: "C:\\Users\\Public\\Games\\.minecraft",
};

export const useAppStore = create<AppState>((set, get) => {
  const initialProfile = storage.getProfile();
  const initialBackendAccessToken = storage.getBackendAccessToken();
  const initialConfig = storage.getLauncherConfig() || DEFAULT_CONFIG;

  return {
    profile: initialProfile,
    backendAccessToken: initialBackendAccessToken,
    config: initialConfig,
    searchQuery: "",
    logo: "logo_gren.svg",
    language: "es",
    setProfile: (profile) => {
      storage.saveProfile(profile);
      set({ profile });
    },
    loginMicrosoft: async () => {
      const session = await authApi.startMicrosoftLogin("select_account");
      console.info("[Auth] Sesion de login creada", {
        sessionId: session.sessionId,
        callbackUrl: session.callbackUrl,
      });

      const popup = window.open(
        session.authorizeUrl,
        "mclaunch-ms-auth",
        "popup=yes,width=520,height=720,resizable=no,scrollbars=yes"
      );

      if (!popup) {
        throw new Error("No se pudo abrir la ventana de autenticacion.");
      }

      const controller = new AbortController();
      let popupClosedAt: number | null = null;
      const GRACE_PERIOD_MS = 5_000;

      const popupClosedWatcher = window.setInterval(() => {
        if (popup.closed && !controller.signal.aborted) {
          if (popupClosedAt === null) {
            popupClosedAt = Date.now();
          } else if (Date.now() - popupClosedAt >= GRACE_PERIOD_MS) {
            controller.abort();
          }
        }
      }, 400);

      let status;
      try {
        status = await authApi.waitForLogin(session.sessionId, controller.signal);
      } catch (error) {
        if (controller.signal.aborted) {
          throw new Error("Inicio de sesion cancelado por el usuario.");
        }
        throw error;
      } finally {
        window.clearInterval(popupClosedWatcher);
        if (!popup.closed) popup.close();
      }

      if (!status.result) {
        throw new Error("La API no devolvio la informacion final del login.");
      }

      const persistedProfile = await window.api?.setBackendAuthSession?.(status.result.launcher);
      const backendAccessToken = status.result.accessToken;
      const newProfile = persistedProfile
        ? {
            username: persistedProfile.username,
            uuid: persistedProfile.uuid,
            skinUrl: persistedProfile.skinUrl ?? null,
            isOnboardingCompleted: true,
          }
        : mapAccountToProfile(status.result.account);

      storage.saveBackendAccessToken(backendAccessToken);
      storage.saveProfile(newProfile);
      set({ profile: newProfile, backendAccessToken });
    },
    logoutMicrosoft: async () => {
      const backendAccessToken = get().backendAccessToken;

      if (backendAccessToken) {
        try {
          await authApi.logout(backendAccessToken);
        } catch (error) {
          console.warn("No se pudo notificar el logout al backend.", error);
        }
      }

      if (window.api && window.api.logoutMicrosoft) {
        await window.api.logoutMicrosoft();
      }

      storage.clearAll?.();
      set({ profile: null, backendAccessToken: null });
    },
    checkAuth: async () => {
      const backendAccessToken = storage.getBackendAccessToken();

      if (backendAccessToken) {
        try {
          const account = await authApi.getCurrentAccount(backendAccessToken);
          const profile = mapAccountToProfile(account);
          storage.saveProfile(profile);
          set({ profile, backendAccessToken });
          return;
        } catch (error) {
          console.warn("No se pudo restaurar la sesion desde el backend.", error);
          storage.clearBackendAccessToken();
        }
      }

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
          set({ profile, backendAccessToken: null });
          return;
        }

        storage.clearAll?.();
        set({ profile: null, backendAccessToken: null });
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
      set({ profile: null, backendAccessToken: null, config: initialConfig, searchQuery: "", logo: "logo_gren.svg", language: "es" });
    }
  };
});
