// ========================================================
// PRELOAD.TS - Archivo de precarga optimizado
// ========================================================
// Este archivo se ejecuta en el contexto del renderer ANTES de que cargue la UI de React.
// Su único propósito es exponer una API segura al renderer (contextBridge) sin exponer Node.js completo.
// Optimizaciones aplicadas:
// - Tipado estricto y completo
// - Remoción de listeners automática (cleanup)
// - No se bloquea el hilo principal
// - Documentación completa JSDoc para entender cada método

import { contextBridge, ipcRenderer, IpcRendererEvent, shell } from "electron";
import type { LaunchPayload, MinecraftVersion } from "./ipc/launcher";

/**
 * Canales IPC constantes (evita errores tipográficos y permite tree-shaking)
 */
const CHANNELS = {
  launch: "launcher:launch",
  log: "launcher:log",
  progress: "launcher:progress",
  status: "launcher:status",
  getVersions: "launcher:getVersions",
  getWeeklyActivity: "db:getWeeklyActivity",
  getStatistics: "db:getStatistics",
  getDownloadedVersions: "db:getDownloadedVersions",
  clearCache: "app:clearCache",
  clearAllData: "app:clearAllData",
  restartApp: "app:restartApp",
  getLogo: "db:getLogo",
  setLogo: "db:setLogo",
  getLanguage: "db:getLanguage",
  setLanguage: "db:setLanguage",
  loginMicrosoft: "auth:loginMicrosoft",
  openBackendLoginPopup: "auth:openBackendLoginPopup",
  logoutMicrosoft: "auth:logoutMicrosoft",
  getProfile: "auth:getProfile",
  setBackendSession: "auth:setBackendSession",
} as const;

const DEFAULT_API_BASE_URL = "https://my3u2eiq2b78xmirlj4l.servgrid.xyz";

/**
 * Estados posibles del launcher (usado por la UI para mostrar feedback en tiempo real)
 */
type LauncherStatus = "idle" | "running" | "playing" | "done" | "error";

/**
 * API pública expuesta al renderer vía contextBridge.
 * TODOS los métodos son seguros, no exponen Node.js directamente.
 */
const api = {
  /**
   * Inicia Minecraft con la configuración proporcionada
   * @param config Payload completo de lanzamiento
   */
  launchMinecraft: (config: LaunchPayload): void => {
    ipcRenderer.send(CHANNELS.launch, config);
  },

  /**
   * Obtiene las versiones oficiales de Minecraft (con caché en el main process)
   */
  getVersions: (): Promise<MinecraftVersion[]> => {
    return ipcRenderer.invoke(CHANNELS.getVersions);
  },

  getWeeklyActivity: (): Promise<number[]> => {
    return ipcRenderer.invoke(CHANNELS.getWeeklyActivity);
  },

  getStatistics: (): Promise<{ win_rate: number; kda: number }> => {
    return ipcRenderer.invoke(CHANNELS.getStatistics);
  },

  getDownloadedVersions: (): Promise<string[]> => {
    return ipcRenderer.invoke(CHANNELS.getDownloadedVersions);
  },

  syncDownloadedVersions: (gameDir: string): Promise<string[]> => {
    return ipcRenderer.invoke("db:syncVersions", gameDir);
  },

  getLogo: (): Promise<string> => {
    return ipcRenderer.invoke(CHANNELS.getLogo);
  },

  setLogo: (logo: string): void => {
    ipcRenderer.send(CHANNELS.setLogo, logo);
  },

  getLanguage: (): Promise<string> => {
    return ipcRenderer.invoke(CHANNELS.getLanguage);
  },

  setLanguage: (lang: string): void => {
    ipcRenderer.send(CHANNELS.setLanguage, lang);
  },

  loginMicrosoft: (): Promise<any> => {
    return ipcRenderer.invoke(CHANNELS.loginMicrosoft);
  },

  openBackendLoginPopup: (payload: { authorizeUrl: string; callbackUrl: string }): Promise<boolean> => {
    return ipcRenderer.invoke(CHANNELS.openBackendLoginPopup, payload);
  },

  setBackendAuthSession: (payload: {
    msmcToken: string;
    mclcAuth: unknown;
    profile: unknown;
  }): Promise<any> => {
    return ipcRenderer.invoke(CHANNELS.setBackendSession, payload);
  },

  logoutMicrosoft: (): Promise<boolean> => {
    return ipcRenderer.invoke(CHANNELS.logoutMicrosoft);
  },

  getProfile: (): Promise<any> => {
    return ipcRenderer.invoke(CHANNELS.getProfile);
  },

  clearCache: (): Promise<void> => {
    return ipcRenderer.invoke(CHANNELS.clearCache);
  },

  clearAllData: (): Promise<void> => {
    return ipcRenderer.invoke(CHANNELS.clearAllData);
  },

  restartApp: (): void => {
    ipcRenderer.send(CHANNELS.restartApp);
  },

  getApiBaseUrl: (): string => {
    return process.env.MCLAUNCH_API_BASE_URL?.trim() || DEFAULT_API_BASE_URL;
  },

  openExternal: (url: string): Promise<void> => shell.openExternal(url).then(() => undefined),

  // Controles de ventana (rápidos, fire-and-forget)
  minimizeWindow: (): void => ipcRenderer.send("window:minimize"),
  maximizeWindow: (): void => ipcRenderer.send("window:maximize"),
  closeWindow: (): void => ipcRenderer.send("window:close"),

  /**
   * Suscripción a logs del launcher (retorna función de cleanup automática)
   */
  onLauncherLog: (callback: (message: string) => void): (() => void) => {
    const listener = (_event: IpcRendererEvent, message: string): void => callback(message);
    ipcRenderer.on(CHANNELS.log, listener);
    return () => ipcRenderer.removeListener(CHANNELS.log, listener);
  },

  onLauncherProgress: (
    callback: (progress: { type: string; task: number; total: number }) => void
  ): (() => void) => {
    const listener = (
      _event: IpcRendererEvent,
      progress: { type: string; task: number; total: number }
    ): void => callback(progress);
    ipcRenderer.on(CHANNELS.progress, listener);
    return () => ipcRenderer.removeListener(CHANNELS.progress, listener);
  },

  onLauncherStatus: (callback: (status: LauncherStatus) => void): (() => void) => {
    const listener = (_event: IpcRendererEvent, status: LauncherStatus): void => callback(status);
    ipcRenderer.on(CHANNELS.status, listener);
    return () => ipcRenderer.removeListener(CHANNELS.status, listener);
  },
} as const;

contextBridge.exposeInMainWorld("api", api);
