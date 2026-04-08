// ========================================================
// ipc/launcher.ts - LAUNCHER IPC (COMPLETO Y ACTUALIZADO 2026)
// ========================================================
// Archivo completo y optimizado del manejador IPC del launcher.
// 
// OPTIMALIZACIONES APLICADAS (respecto a la versión original):
// - buildHomeClientWorkspace ahora es 100% ASÍNCRONO (spawn en vez de spawnSync → no bloquea el hilo principal)
// - Caché inteligente de versiones de Minecraft (30 minutos TTL)
// - Caché de JAR del mc-home-client (solo recompila si han pasado +24h o no existe)
// - Todo con documentación JSDoc completa
// - Código más limpio, tipado estricto y mantenible
// - Mejor manejo de errores y logs
// - Uso de child_process.spawn para compilación no bloqueante

import { BrowserView, BrowserWindow, ipcMain, app } from "electron";
import { spawn, SpawnOptions } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { initDb, getWeeklyActivity, getStatistics, getDownloadedVersions, addDownloadedVersion, syncDownloadedVersions, clearCache, clearAllData, getLogo, setLogo, getLanguage, setLanguage, db } from "./db";
import { discordPresence } from "../services/discordPresence";
import { launcherActivitySocket } from "../services/launcherActivitySocket";

let versionsCache: MinecraftVersion[] | null = null;
let versionsCacheTime = 0;
const VERSIONS_CACHE_TTL_MS = 1000 * 60 * 30; // 30 minutos

/**
 * Verifica si Java está instalado en el sistema
 */
function isJavaInstalled(): boolean {
  try {
    require("child_process").execSync("java -version", { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

export type LaunchPayload = {
  username: string;
  version: string;
  memoryMb: number;
  gameDir: string;
};

export type MinecraftVersion = {
  id: string;
  type: string;
  url: string;
  time: string;
  releaseTime: string;
};

type FabricVersionProfile = {
  id: string;
  inheritsFrom: string;
  releaseTime: string;
  time: string;
  type: string;
  mainClass: string;
  arguments?: {
    game?: unknown[];
    jvm?: unknown[];
  };
  libraries?: Array<Record<string, unknown>>;
};

const MC_HOME_CLIENT = {
  modId: "mclaunch-home",
  supportedVersion: "1.20.1",
  loaderVersion: "0.18.6",
  profileBaseUrl: "https://meta.fabricmc.net/v2/versions/loader",
} as const;

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

type LauncherStatus = "idle" | "running" | "playing" | "done" | "error";
type WindowProvider = () => BrowserWindow | null;
let backendAuthWindow: BrowserWindow | null = null;
let backendAuthView: BrowserView | null = null;
let backendAuthViewOwner: BrowserWindow | null = null;

/* ==================== EMITTERS ==================== */
const emitLog = (window: BrowserWindow | null, message: string): void => {
  if (!window || window.isDestroyed()) return;
  window.webContents.send(CHANNELS.log, message);
};

const emitStatus = (window: BrowserWindow | null, status: LauncherStatus): void => {
  if (!window || window.isDestroyed()) return;
  window.webContents.send(CHANNELS.status, status);
};

const emitProgress = (window: BrowserWindow | null, progress: { type: string; task: number; total: number }): void => {
  if (!window || window.isDestroyed()) return;
  window.webContents.send(CHANNELS.progress, progress);
};

const emitGradleOutput = (window: BrowserWindow | null, output: string | null | undefined): void => {
  if (!output) return;
  output
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(-8)
    .forEach((line) => emitLog(window, `[mc-home-client] ${line}`));
};

/* ==================== UTILIDADES ==================== */
const readJsonFile = <T>(filePath: string): T | null => {
  if (!fs.existsSync(filePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
  } catch {
    return null;
  }
};

const resolveExistingPath = (candidates: string[]): string | null => {
  for (const candidate of candidates) {
    if (candidate && fs.existsSync(candidate)) return candidate;
  }
  return null;
};

const getWorkspaceRootCandidates = (): string[] => {
  const appPath = app.getAppPath();
  const cwd = process.cwd();
  const resourcesPath = process.resourcesPath;
  return Array.from(new Set([cwd, appPath, path.dirname(appPath), resourcesPath, path.dirname(resourcesPath)].filter(Boolean)));
};

const resolveMcHomeClientProjectDir = (): string | null => {
  const candidates = getWorkspaceRootCandidates().map((rootDir) => path.join(rootDir, "mc-home-client"));
  return resolveExistingPath(candidates);
};

const resolveLatestHomeClientJar = (projectDir: string): string | null => {
  const libsDir = path.join(projectDir, "build", "libs");
  if (!fs.existsSync(libsDir)) return null;

  const jars = fs
    .readdirSync(libsDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".jar") && !entry.name.includes("-sources") && !entry.name.includes("-dev"))
    .map((entry) => ({
      fullPath: path.join(libsDir, entry.name),
      modifiedAt: fs.statSync(path.join(libsDir, entry.name)).mtimeMs,
    }))
    .sort((a, b) => b.modifiedAt - a.modifiedAt);

  return jars[0]?.fullPath ?? null;
};

/**
 * Compila mc-home-client de forma ASÍNCRONA (no bloquea el main thread)
 */
const buildHomeClientWorkspaceAsync = async (window: BrowserWindow | null, projectDir: string): Promise<string | null> => {
  const wrapperPath = process.platform === "win32"
    ? path.join(projectDir, "gradlew.bat")
    : path.join(projectDir, "gradlew");

  // Cache inteligente: si existe JAR reciente, usarlo
  const existingJar = resolveLatestHomeClientJar(projectDir);
  if (existingJar && fs.existsSync(existingJar)) {
    const stats = fs.statSync(existingJar);
    if (Date.now() - stats.mtimeMs < 1000 * 60 * 60 * 24) { // menos de 24 horas
      emitLog(window, "[mc-home-client] Usando JAR precompilado (caché inteligente).");
      return existingJar;
    }
  }

  if (!fs.existsSync(wrapperPath)) {
    emitLog(window, "[mc-home-client] No se encontró gradle wrapper. Usando último JAR disponible.");
    return existingJar;
  }

  emitLog(window, "[mc-home-client] Compilando cliente home de forma asíncrona...");

  const command = process.platform === "win32" ? "cmd.exe" : wrapperPath;
  const args = process.platform === "win32"
    ? ["/c", wrapperPath, "--no-daemon", "build"]
    : ["--no-daemon", "build"];

  return new Promise<string | null>((resolve) => {
    const child = spawn(command, args, {
      cwd: projectDir,
      stdio: ["ignore", "pipe", "pipe"],
    } as SpawnOptions);

    child.stdout?.on("data", (data) => emitGradleOutput(window, data.toString()));
    child.stderr?.on("data", (data) => emitGradleOutput(window, data.toString()));

    child.on("close", (code) => {
      if (code !== 0) {
        emitLog(window, `[mc-home-client] Build falló (código ${code}). Intentando usar JAR anterior.`);
      }
      resolve(resolveLatestHomeClientJar(projectDir));
    });
  });
};

const resolveHomeClientArtifact = async (window: BrowserWindow | null): Promise<string | null> => {
  const projectDir = resolveMcHomeClientProjectDir();
  if (!projectDir) {
    emitLog(window, "[mc-home-client] No se encontró el subproyecto mc-home-client. Modo vanilla activado.");
    return null;
  }
  return buildHomeClientWorkspaceAsync(window, projectDir);
};

const ensureFabricProfile = async (window: BrowserWindow | null, gameDir: string, minecraftVersion: string): Promise<FabricVersionProfile | null> => {
  if (minecraftVersion !== MC_HOME_CLIENT.supportedVersion) {
    emitLog(window, `[mc-home-client] ${minecraftVersion} no tiene home screen personalizado todavía.`);
    return null;
  }

  const profileId = `fabric-loader-${MC_HOME_CLIENT.loaderVersion}-${minecraftVersion}`;
  const profileDir = path.join(gameDir, "versions", profileId);
  const profilePath = path.join(profileDir, `${profileId}.json`);
  const cachedProfile = readJsonFile<FabricVersionProfile>(profilePath);

  try {
    const response = await fetch(`${MC_HOME_CLIENT.profileBaseUrl}/${minecraftVersion}/${MC_HOME_CLIENT.loaderVersion}/profile/json`);
    if (!response.ok) throw new Error(`Fabric Meta: ${response.status}`);
    const profile = (await response.json()) as FabricVersionProfile;
    fs.mkdirSync(profileDir, { recursive: true });
    fs.writeFileSync(profilePath, JSON.stringify(profile, null, 2));
    emitLog(window, `[mc-home-client] Perfil Fabric ${profile.id} listo.`);
    return profile;
  } catch (error) {
    if (cachedProfile) {
      emitLog(window, "[mc-home-client] Usando perfil Fabric en caché.");
      return cachedProfile;
    }
    emitLog(window, `[mc-home-client] Error al obtener perfil Fabric: ${error}`);
    return null;
  }
};

const installHomeClientMod = (window: BrowserWindow | null, gameDir: string, jarPath: string): string => {
  const modsDir = path.join(gameDir, "mods");
  const destination = path.join(modsDir, `${MC_HOME_CLIENT.modId}.jar`);

  fs.mkdirSync(modsDir, { recursive: true });

  // Limpiar versiones antiguas del mod
  for (const file of fs.readdirSync(modsDir)) {
    if (file !== path.basename(destination) && file.startsWith(MC_HOME_CLIENT.modId) && file.endsWith(".jar")) {
      fs.rmSync(path.join(modsDir, file), { force: true });
    }
  }

  fs.copyFileSync(jarPath, destination);
  emitLog(window, `[mc-home-client] Mod instalado en ${destination}`);
  return destination;
};

const prepareHomeClientRuntime = async (window: BrowserWindow | null, payload: LaunchPayload): Promise<{ enabled: boolean; customVersionId?: string }> => {
  const profile = await ensureFabricProfile(window, payload.gameDir, payload.version);
  if (!profile) return { enabled: false };

  const jarPath = await resolveHomeClientArtifact(window);
  if (!jarPath) return { enabled: false };

  installHomeClientMod(window, payload.gameDir, jarPath);
  return { enabled: true, customVersionId: profile.id };
};

/* ==================== MICROSOFT AUTH HELPERS ==================== */
const resolveAuthErrorMessage = (error: unknown): string => {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "string") return error;
  if (typeof error === "object" && error !== null) {
    const anyError = error as Record<string, unknown>;
    const candidates = [anyError.message, anyError.error, anyError.code, anyError.reason];
    for (const candidate of candidates) {
      if (typeof candidate === "string" && candidate.trim()) return candidate;
    }
  }
  return "Error desconocido al iniciar sesión";
};

const isMicrosoftAuthRedirect = (url: string, redirectUri: string): boolean => url.startsWith(redirectUri);

const extractMicrosoftAuthCode = (url: string, redirectUri: string): string | null => {
  if (!isMicrosoftAuthRedirect(url, redirectUri)) return null;
  try {
    return new URL(url).searchParams.get("code");
  } catch {
    return null;
  }
};

const extractMicrosoftAuthError = (url: string, redirectUri: string): string | null => {
  if (!isMicrosoftAuthRedirect(url, redirectUri)) return null;
  try {
    const parsed = new URL(url);
    const error = parsed.searchParams.get("error");
    const description = parsed.searchParams.get("error_description");
    if (!error && !description) return null;
    if (error === "access_denied") return "Inicio de sesión cancelado por el usuario";
    return description || error;
  } catch {
    return null;
  }
};

const resolveSkinUrl = (profile: { skins?: Array<{ state?: string; url?: string }> } | null | undefined): string | null => {
  if (!profile?.skins?.length) return null;
  const active = profile.skins.find((s) => s.state === "ACTIVE" && s.url?.trim());
  if (active?.url) return active.url;
  const first = profile.skins.find((s) => s.url?.trim());
  return first?.url ?? null;
};

const loginWithMicrosoftPopup = async (parentWindow: BrowserWindow): Promise<any> => {
  const { Auth } = await import("msmc");
  const auth = new Auth("select_account");
  const redirectUri = auth.token.redirect;
  const authWindow = new BrowserWindow({
    parent: parentWindow,
    modal: true,
    width: 520,
    height: 700,
    resizable: false,
    minimizable: false,
    maximizable: false,
    autoHideMenuBar: true,
    show: false,
    title: "Iniciar sesión con Microsoft",
    webPreferences: { nodeIntegration: false, contextIsolation: true, sandbox: false },
  });

  let isCompleted = false;
  let isClosingProgrammatically = false;

  const closeWindowSafely = () => {
    if (authWindow.isDestroyed()) return;
    isClosingProgrammatically = true;
    authWindow.close();
  };

  const authCode = await new Promise<string>((resolve, reject) => {
    const handleNavigation = (targetUrl: string) => {
      const oauthError = extractMicrosoftAuthError(targetUrl, redirectUri);
      if (oauthError) {
        isCompleted = true;
        closeWindowSafely();
        reject(new Error(oauthError));
        return;
      }
      const code = extractMicrosoftAuthCode(targetUrl, redirectUri);
      if (code) {
        isCompleted = true;
        closeWindowSafely();
        resolve(code);
      }
    };

    authWindow.once("ready-to-show", () => authWindow.show());
    authWindow.on("closed", () => {
      if (!isCompleted && !isClosingProgrammatically) reject(new Error("Inicio de sesión cancelado por el usuario"));
    });

    authWindow.webContents.on("will-redirect", (event, url) => {
      if (isMicrosoftAuthRedirect(url, redirectUri)) event.preventDefault();
      handleNavigation(url);
    });
    authWindow.webContents.on("will-navigate", (event, url) => {
      if (isMicrosoftAuthRedirect(url, redirectUri)) event.preventDefault();
      handleNavigation(url);
    });
    authWindow.webContents.on("did-navigate", (_, url) => handleNavigation(url));
    authWindow.webContents.on("did-fail-load", (_, errorCode, errorDescription, validatedUrl) => {
      if (isCompleted || errorCode === -3) return;
      if (isMicrosoftAuthRedirect(validatedUrl, redirectUri)) handleNavigation(validatedUrl);
      else reject(new Error(`Error cargando autenticación: ${errorDescription}`));
    });

    authWindow.loadURL(auth.createLink()).catch((e) => reject(e));
  });

  return auth.login(authCode);
};

const openBackendLoginPopup = async (
  parentWindow: BrowserWindow,
  authorizeUrl: string,
  callbackUrl: string,
): Promise<void> => {
  if (backendAuthWindow && !backendAuthWindow.isDestroyed()) {
    backendAuthWindow.focus();
    await backendAuthWindow.loadURL(authorizeUrl);
    return;
  }

  const authWindow = new BrowserWindow({
    parent: parentWindow,
    modal: false,
    width: 520,
    height: 720,
    resizable: false,
    minimizable: false,
    maximizable: false,
    autoHideMenuBar: true,
    show: false,
    title: "Iniciar sesión con Microsoft",
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
  });
  backendAuthWindow = authWindow;
  authWindow.removeMenu();

  const closeIfCallbackReached = (targetUrl: string): void => {
    if (!targetUrl.startsWith(callbackUrl)) return;
    if (!authWindow.isDestroyed()) authWindow.close();
  };

  authWindow.once("ready-to-show", () => authWindow.show());
  authWindow.on("closed", () => {
    if (backendAuthWindow === authWindow) backendAuthWindow = null;
  });
  authWindow.webContents.setWindowOpenHandler(({ url }) => {
    void authWindow.loadURL(url);
    return { action: "deny" };
  });
  authWindow.webContents.on("did-navigate", (_, url) => closeIfCallbackReached(url));
  authWindow.webContents.on("did-redirect-navigation", (_, url) => closeIfCallbackReached(url));
  authWindow.webContents.on("render-process-gone", (_event, details) => {
    console.error("[auth-popup] El renderer del popup de login se cerrÃ³", details);
  });
  authWindow.webContents.on("did-fail-load", (_event, errorCode, errorDescription, validatedUrl) => {
    if (errorCode === -3) return;
    console.error("[auth-popup] Error cargando autenticaciÃ³n", {
      errorCode,
      errorDescription,
      validatedUrl,
    });
  });

  await authWindow.loadURL(authorizeUrl);
};
void openBackendLoginPopup;

const openBackendLoginInAppView = async (
  parentWindow: BrowserWindow,
  authorizeUrl: string,
  callbackUrl: string,
): Promise<void> => {
  if (backendAuthViewOwner && backendAuthViewOwner !== parentWindow && backendAuthView) {
    backendAuthViewOwner.setBrowserView(null);
    backendAuthView.webContents.close({ waitForBeforeUnload: false });
    backendAuthView = null;
    backendAuthViewOwner = null;
  }

  const closeAuthView = (): void => {
    if (!backendAuthView || !backendAuthViewOwner) return;
    backendAuthView.webContents.removeAllListeners();
    backendAuthViewOwner.setBrowserView(null);
    backendAuthView.webContents.close({ waitForBeforeUnload: false });
    backendAuthView = null;
    backendAuthViewOwner = null;
  };

  const fitAuthView = (): void => {
    if (!backendAuthView) return;
    const [width, height] = parentWindow.getContentSize();
    backendAuthView.setBounds({ x: 0, y: 0, width, height });
    backendAuthView.setAutoResize({ width: true, height: true });
  };

  const view =
    backendAuthView ??
    new BrowserView({
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: true,
      },
    });

  backendAuthView = view;
  backendAuthViewOwner = parentWindow;
  parentWindow.setBrowserView(view);
  fitAuthView();
  parentWindow.removeListener("resize", fitAuthView);
  parentWindow.on("resize", fitAuthView);
  parentWindow.once("closed", closeAuthView);

  const closeIfCallbackReached = (targetUrl: string): void => {
    if (!targetUrl.startsWith(callbackUrl)) return;
    closeAuthView();
  };

  view.webContents.setWindowOpenHandler(({ url }) => {
    void view.webContents.loadURL(url);
    return { action: "deny" };
  });
  view.webContents.on("did-navigate", (_event, url) => closeIfCallbackReached(url));
  view.webContents.on("did-redirect-navigation", (_event, url) => closeIfCallbackReached(url));
  view.webContents.on("did-fail-load", (_event, errorCode, errorDescription, validatedUrl) => {
    if (errorCode === -3) return;
    console.error("[auth-inline] Error cargando autenticacion", {
      errorCode,
      errorDescription,
      validatedUrl,
    });
  });
  view.webContents.on("render-process-gone", (_event, details) => {
    console.error("[auth-inline] El renderer del login integrado se cerro", details);
    closeAuthView();
  });

  await view.webContents.loadURL(authorizeUrl);
};

/* ==================== REGISTRO PRINCIPAL IPC ==================== */
export const registerLauncherIpc = (getWindow: WindowProvider): void => {
  initDb();

  // Handlers de base de datos
  ipcMain.handle(CHANNELS.getWeeklyActivity, () => getWeeklyActivity());
  ipcMain.handle(CHANNELS.getStatistics, () => getStatistics());
  ipcMain.handle(CHANNELS.getDownloadedVersions, () => getDownloadedVersions());
  ipcMain.handle("db:syncVersions", async (_, gameDir: string) => syncDownloadedVersions(gameDir));
  ipcMain.handle(CHANNELS.getLogo, () => getLogo());
  ipcMain.on(CHANNELS.setLogo, (_, logo: string) => setLogo(logo));
  ipcMain.handle(CHANNELS.getLanguage, () => getLanguage());
  ipcMain.on(CHANNELS.setLanguage, (_, lang: string) => setLanguage(lang));
  ipcMain.handle(CHANNELS.clearCache, () => clearCache());
  ipcMain.handle(CHANNELS.clearAllData, () => clearAllData());
  ipcMain.on(CHANNELS.restartApp, () => { app.relaunch(); app.exit(0); });

  // Microsoft Auth
  ipcMain.handle(CHANNELS.loginMicrosoft, async () => {
    try {
      const parentWindow = getWindow();
      if (!parentWindow) throw new Error("Ventana principal no disponible");
      const xbox = await loginWithMicrosoftPopup(parentWindow);
      const mc = await xbox.getMinecraft();

      const msmcToken = xbox.save();
      const mcToken = mc.mclc();
      const profile = mc.profile as { id?: string; name?: string; skins?: Array<{ state?: string; url?: string }> };

      db.prepare("INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)").run("msmc_token", msmcToken);
      db.prepare("INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)").run("mc_profile", JSON.stringify(profile));
      db.prepare("INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)").run("mclc_auth", JSON.stringify(mcToken));

      let backendAccessToken: string | null = null;
      try {
        const apiBase = process.env.MCLAUNCH_API_BASE_URL?.trim() || "https://my3u2eiq2b78xmirlj4l.servgrid.xyz";
        const res = await fetch(`${apiBase}/api/v1/login/from-launcher`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ msmcToken, mclcAuth: mcToken, profile }),
        });
        if (res.ok) {
          const data = await res.json() as { ok: boolean; data?: { accessToken?: string } };
          backendAccessToken = data?.data?.accessToken ?? null;
        }
      } catch {
        // Backend no disponible, continua sin JWT
      }

      return {
        username: profile?.name || "Player",
        uuid: profile?.id || "00000000-0000-0000-0000-000000000000",
        skinUrl: resolveSkinUrl(profile),
        isOnboardingCompleted: true,
        backendAccessToken,
      };
    } catch (error: unknown) {
      const message = resolveAuthErrorMessage(error);
      if (message.includes("access_denied") || message.includes("error.gui.closed")) throw new Error("Inicio de sesión cancelado por el usuario");
      throw new Error(message);
    }
  });

  ipcMain.handle(CHANNELS.openBackendLoginPopup, async (_event, payload: { authorizeUrl: string; callbackUrl: string }) => {
    const parentWindow = getWindow();
    if (!parentWindow) throw new Error("Ventana principal no disponible");
    await openBackendLoginInAppView(parentWindow, payload.authorizeUrl, payload.callbackUrl);
    return true;
  });

  ipcMain.handle(CHANNELS.logoutMicrosoft, () => {
    db.prepare("DELETE FROM app_settings WHERE key IN ('msmc_token', 'mc_profile', 'mclc_auth')").run();
    return true;
  });

  ipcMain.handle(CHANNELS.getProfile, () => {
    const row = db.prepare("SELECT value FROM app_settings WHERE key = 'mc_profile'").get() as any;
    if (!row) return null;
    try {
      const p = JSON.parse(row.value);
      return { username: p.name, uuid: p.id, skinUrl: resolveSkinUrl(p), isOnboardingCompleted: true };
    } catch {
      return null;
    }
  });

  ipcMain.handle(
    CHANNELS.setBackendSession,
    (
      _event,
      payload: {
        msmcToken: string;
        mclcAuth: unknown;
        profile: unknown;
      },
    ) => {
      const profile = payload.profile as { id?: string; name?: string; skins?: Array<{ state?: string; url?: string }> };

      db.prepare("INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)").run("msmc_token", payload.msmcToken);
      db.prepare("INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)").run("mc_profile", JSON.stringify(payload.profile));
      db.prepare("INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)").run("mclc_auth", JSON.stringify(payload.mclcAuth));

      return {
        username: profile?.name || "Player",
        uuid: profile?.id || "00000000-0000-0000-0000-000000000000",
        skinUrl: resolveSkinUrl(profile),
        isOnboardingCompleted: true,
      };
    },
  );

  // Versiones de Minecraft con caché
  ipcMain.handle(CHANNELS.getVersions, async () => {
    const now = Date.now();
    if (versionsCache && now - versionsCacheTime < VERSIONS_CACHE_TTL_MS) return versionsCache;

    try {
      const res = await fetch("https://launchermeta.mojang.com/mc/game/version_manifest.json");
      const data = await res.json();
      versionsCache = data.versions.filter((v: any) => v.type === "release").slice(0, 50);
      versionsCacheTime = now;
      return versionsCache;
    } catch {
      return versionsCache || [];
    }
  });

  // Lanza Minecraft (corazón del launcher)
  ipcMain.on(CHANNELS.launch, async (_event, payload: LaunchPayload) => {
    const window = getWindow();
    emitStatus(window, "running");
    emitLog(window, `Preparando lanzamiento para ${payload.username}...`);
    discordPresence.setLaunchingPresence(payload);
    launcherActivitySocket.setLaunchingPresence(payload);

    if (!isJavaInstalled()) {
      emitLog(window, "Error: Java no está instalado. Instala Java 17 o superior desde https://adoptium.net");
      emitStatus(window, "error");
      discordPresence.setLauncherPresence();
      launcherActivitySocket.setLauncherPresence();
      return;
    }

    try {
      const { Client, Authenticator } = await import("minecraft-launcher-core");
      fs.mkdirSync(payload.gameDir, { recursive: true });

      const homeClientRuntime = await prepareHomeClientRuntime(window, payload);

      const launcher = new Client();

      launcher.on("progress", (e) => emitProgress(window, e));
      launcher.on("debug", (message) => emitLog(window, String(message)));
      launcher.on("data", (message) => {
        const text = String(message).trim();
        if (text) emitLog(window, `[minecraft] ${text}`);
      });
      launcher.on("close", (code) => {
        emitLog(window, `Minecraft cerrado (código: ${code})`);
        const jarPath = path.join(payload.gameDir, "versions", payload.version, `${payload.version}.jar`);
        if (fs.existsSync(jarPath)) addDownloadedVersion(payload.version);
        discordPresence.setLauncherPresence();
        launcherActivitySocket.setLauncherPresence();
        emitStatus(window, "done");
      });

      // Auth
      const authRow = db.prepare("SELECT value FROM app_settings WHERE key = 'mclc_auth'").get() as any;
      let authorization;
      if (authRow) {
        authorization = JSON.parse(authRow.value);
      } else {
        const profileRow = db.prepare("SELECT value FROM app_settings WHERE key = 'mc_profile'").get() as any;
        let playerName = payload.username || "Player";
        if (profileRow) {
          try { playerName = JSON.parse(profileRow.value).name; } catch {}
        }
        authorization = await Authenticator.getAuth(playerName);
      }

      const opts = {
        authorization,
        root: payload.gameDir,
        version: {
          number: payload.version,
          type: "release",
          ...(homeClientRuntime.customVersionId
            ? { custom: homeClientRuntime.customVersionId }
            : {}),
        },
        memory: {
          max: `${payload.memoryMb}M`,
          min: "1024M",
        },
        overrides: { detached: false },
        window: {
          width: 1280,
          height: 720,
          fullscreen: false,
        },
      };

      emitLog(window, `Lanzando ${payload.version} con ${payload.memoryMb}MB RAM...`);
      const flavor = homeClientRuntime.enabled ? `Fabric + ${MC_HOME_CLIENT.modId}` : "vanilla";
      emitLog(window, `Perfil: ${flavor}`);

      const minecraftProcess = await launcher.launch(opts);
      if (!minecraftProcess) throw new Error("No se pudo iniciar el proceso de Minecraft");

      emitLog(window, "Minecraft en ejecución.");
      discordPresence.setPlayingPresence(payload);
      launcherActivitySocket.setPlayingPresence(payload);
      emitStatus(window, "playing");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error desconocido";
      emitLog(window, `Error en lanzamiento: ${message}`);
      discordPresence.setLauncherPresence();
      launcherActivitySocket.setLauncherPresence();
      emitStatus(window, "error");
    }
  });
};

export { CHANNELS };
