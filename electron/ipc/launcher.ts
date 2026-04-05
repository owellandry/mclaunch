import { BrowserWindow, ipcMain, app } from "electron";
import { Client, Authenticator } from "minecraft-launcher-core";
import { execSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { initDb, getWeeklyActivity, getStatistics, getDownloadedVersions, addDownloadedVersion, clearCache, clearAllData, getLogo, setLogo, getLanguage, setLanguage, db } from "./db";
import { Auth } from "msmc";

function isJavaInstalled(): boolean {
  try {
    execSync("java -version", { stdio: "ignore" });
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
  logoutMicrosoft: "auth:logoutMicrosoft",
  getProfile: "auth:getProfile"
} as const;

const emitLog = (window: BrowserWindow, message: string): void => {
  window.webContents.send(CHANNELS.log, message);
};

const emitStatus = (window: BrowserWindow, status: "idle" | "running" | "playing" | "done" | "error"): void => {
  window.webContents.send(CHANNELS.status, status);
};

const emitProgress = (window: BrowserWindow, progress: { type: string; task: number; total: number }): void => {
  window.webContents.send(CHANNELS.progress, progress);
};

const emitGradleOutput = (window: BrowserWindow, output: string | null | undefined): void => {
  if (!output) {
    return;
  }

  output
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(-8)
    .forEach((line) => emitLog(window, `[mc-home-client] ${line}`));
};

const readJsonFile = <T>(filePath: string): T | null => {
  if (!fs.existsSync(filePath)) {
    return null;
  }

  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
  } catch {
    return null;
  }
};

const resolveExistingPath = (candidates: string[]): string | null => {
  for (const candidate of candidates) {
    if (candidate && fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return null;
};

const getWorkspaceRootCandidates = (): string[] => {
  const appPath = app.getAppPath();
  const cwd = process.cwd();
  const resourcesPath = process.resourcesPath;

  return Array.from(
    new Set(
      [cwd, appPath, path.dirname(appPath), resourcesPath, path.dirname(resourcesPath)].filter(Boolean)
    )
  );
};

const resolveMcHomeClientProjectDir = (): string | null => {
  const candidates = getWorkspaceRootCandidates().map((rootDir) => path.join(rootDir, "mc-home-client"));
  return resolveExistingPath(candidates);
};

const resolveLatestHomeClientJar = (projectDir: string): string | null => {
  const libsDir = path.join(projectDir, "build", "libs");
  if (!fs.existsSync(libsDir)) {
    return null;
  }

  const jars = fs
    .readdirSync(libsDir, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .filter((name) => name.endsWith(".jar") && !name.includes("-sources") && !name.includes("-dev"))
    .map((name) => {
      const fullPath = path.join(libsDir, name);
      return {
        fullPath,
        modifiedAt: fs.statSync(fullPath).mtimeMs,
      };
    })
    .sort((left, right) => right.modifiedAt - left.modifiedAt);

  return jars[0]?.fullPath ?? null;
};

const buildHomeClientWorkspace = (window: BrowserWindow, projectDir: string): string | null => {
  const wrapperPath = process.platform === "win32"
    ? path.join(projectDir, "gradlew.bat")
    : path.join(projectDir, "gradlew");

  if (!fs.existsSync(wrapperPath)) {
    emitLog(window, "[mc-home-client] No se encontró gradle wrapper, usando el último jar disponible.");
    return resolveLatestHomeClientJar(projectDir);
  }

  emitLog(window, "[mc-home-client] Compilando el cliente del home screen para sincronizar cambios...");

  const command = process.platform === "win32" ? "cmd.exe" : wrapperPath;
  const args = process.platform === "win32"
    ? ["/c", wrapperPath, "--no-daemon", "build"]
    : ["--no-daemon", "build"];

  const result = spawnSync(command, args, {
    cwd: projectDir,
    encoding: "utf8",
  });

  emitGradleOutput(window, result.stdout);
  emitGradleOutput(window, result.stderr);

  if (result.status !== 0) {
    emitLog(window, `[mc-home-client] La compilación falló (código ${result.status ?? "desconocido"}), intentando usar el último jar existente.`);
  }

  return resolveLatestHomeClientJar(projectDir);
};

const resolveHomeClientArtifact = (window: BrowserWindow): string | null => {
  const projectDir = resolveMcHomeClientProjectDir();
  if (!projectDir) {
    emitLog(window, "[mc-home-client] No se encontró el subproyecto mc-home-client. El launcher seguirá en modo vanilla.");
    return null;
  }

  const jarPath = buildHomeClientWorkspace(window, projectDir);
  if (!jarPath) {
    emitLog(window, "[mc-home-client] No se encontró ningún jar compilado para instalar.");
    return null;
  }

  return jarPath;
};

const ensureFabricProfile = async (window: BrowserWindow, gameDir: string, minecraftVersion: string): Promise<FabricVersionProfile | null> => {
  if (minecraftVersion !== MC_HOME_CLIENT.supportedVersion) {
    emitLog(
      window,
      `[mc-home-client] ${minecraftVersion} todavía no tiene home screen personalizado. Se usará vanilla.`
    );
    return null;
  }

  const profileId = `fabric-loader-${MC_HOME_CLIENT.loaderVersion}-${minecraftVersion}`;
  const profileDir = path.join(gameDir, "versions", profileId);
  const profilePath = path.join(profileDir, `${profileId}.json`);
  const cachedProfile = readJsonFile<FabricVersionProfile>(profilePath);

  try {
    const response = await fetch(`${MC_HOME_CLIENT.profileBaseUrl}/${minecraftVersion}/${MC_HOME_CLIENT.loaderVersion}/profile/json`);
    if (!response.ok) {
      throw new Error(`Fabric Meta respondió ${response.status}`);
    }

    const profile = (await response.json()) as FabricVersionProfile;
    fs.mkdirSync(profileDir, { recursive: true });
    fs.writeFileSync(profilePath, JSON.stringify(profile, null, 2));
    emitLog(window, `[mc-home-client] Perfil Fabric ${profile.id} listo en versions/.`);
    return profile;
  } catch (error) {
    if (cachedProfile) {
      emitLog(window, "[mc-home-client] No se pudo refrescar Fabric Meta, usando el perfil Fabric en caché.");
      return cachedProfile;
    }

    const message = error instanceof Error ? error.message : "Error desconocido";
    emitLog(window, `[mc-home-client] No se pudo preparar Fabric: ${message}`);
    return null;
  }
};

const installHomeClientMod = (window: BrowserWindow, gameDir: string, jarPath: string): string => {
  const modsDir = path.join(gameDir, "mods");
  const destination = path.join(modsDir, `${MC_HOME_CLIENT.modId}.jar`);

  fs.mkdirSync(modsDir, { recursive: true });

  for (const existingFile of fs.readdirSync(modsDir)) {
    if (
      existingFile !== path.basename(destination) &&
      existingFile.startsWith(MC_HOME_CLIENT.modId) &&
      existingFile.endsWith(".jar")
    ) {
      fs.rmSync(path.join(modsDir, existingFile), { force: true });
    }
  }

  fs.copyFileSync(jarPath, destination);
  emitLog(window, `[mc-home-client] Mod sincronizado en ${destination}`);

  return destination;
};

const prepareHomeClientRuntime = async (
  window: BrowserWindow,
  payload: LaunchPayload
): Promise<{ enabled: boolean; customVersionId?: string }> => {
  const profile = await ensureFabricProfile(window, payload.gameDir, payload.version);
  if (!profile) {
    return { enabled: false };
  }

  const jarPath = resolveHomeClientArtifact(window);
  if (!jarPath) {
    return { enabled: false };
  }

  installHomeClientMod(window, payload.gameDir, jarPath);

  return {
    enabled: true,
    customVersionId: profile.id,
  };
};

const resolveAuthErrorMessage = (error: unknown): string => {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  if (typeof error === "object" && error !== null) {
    const anyError = error as Record<string, unknown>;
    const candidates = [anyError.message, anyError.error, anyError.code, anyError.reason];
    for (const candidate of candidates) {
      if (typeof candidate === "string" && candidate.trim()) {
        return candidate;
      }
    }
  }
  return "Error desconocido al iniciar sesión";
};

const isMicrosoftAuthRedirect = (url: string, redirectUri: string): boolean => {
  return url.startsWith(redirectUri);
};

const extractMicrosoftAuthCode = (url: string, redirectUri: string): string | null => {
  if (!isMicrosoftAuthRedirect(url, redirectUri)) {
    return null;
  }

  try {
    return new URL(url).searchParams.get("code");
  } catch {
    return null;
  }
};

const extractMicrosoftAuthError = (url: string, redirectUri: string): string | null => {
  if (!isMicrosoftAuthRedirect(url, redirectUri)) {
    return null;
  }

  try {
    const parsedUrl = new URL(url);
    const error = parsedUrl.searchParams.get("error");
    const description = parsedUrl.searchParams.get("error_description");

    if (!error && !description) {
      return null;
    }

    if (error === "access_denied") {
      return "Inicio de sesión cancelado por el usuario";
    }

    return description || error;
  } catch {
    return null;
  }
};

const resolveSkinUrl = (profile: {
  skins?: Array<{ state?: string; url?: string }>;
} | null | undefined): string | null => {
  if (!profile?.skins?.length) {
    return null;
  }

  const activeSkin = profile.skins.find((skin) => skin.state === "ACTIVE" && typeof skin.url === "string" && skin.url.trim());
  if (activeSkin?.url) {
    return activeSkin.url;
  }

  const firstSkin = profile.skins.find((skin) => typeof skin.url === "string" && skin.url.trim());
  return firstSkin?.url ?? null;
};

const loginWithMicrosoftPopup = async (parentWindow: BrowserWindow): Promise<any> => {
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
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
    },
  });

  let isCompleted = false;
  let isClosingProgrammatically = false;

  const closeWindowSafely = (): void => {
    if (authWindow.isDestroyed()) {
      return;
    }

    isClosingProgrammatically = true;
    authWindow.close();
  };

  const authCode = await new Promise<string>((resolve, reject) => {
    const handleNavigation = (targetUrl: string): void => {
      const oauthError = extractMicrosoftAuthError(targetUrl, redirectUri);
      if (oauthError) {
        isCompleted = true;
        closeWindowSafely();
        reject(new Error(oauthError));
        return;
      }

      const code = extractMicrosoftAuthCode(targetUrl, redirectUri);
      if (!code) {
        return;
      }

      isCompleted = true;
      closeWindowSafely();
      resolve(code);
    };

    authWindow.once("ready-to-show", () => {
      authWindow.show();
    });

    authWindow.on("closed", () => {
      if (!isCompleted && !isClosingProgrammatically) {
        reject(new Error("Inicio de sesión cancelado por el usuario"));
      }
    });

    authWindow.webContents.on("will-redirect", (event, targetUrl) => {
      if (isMicrosoftAuthRedirect(targetUrl, redirectUri)) {
        event.preventDefault();
      }
      handleNavigation(targetUrl);
    });

    authWindow.webContents.on("will-navigate", (event, targetUrl) => {
      if (isMicrosoftAuthRedirect(targetUrl, redirectUri)) {
        event.preventDefault();
      }
      handleNavigation(targetUrl);
    });

    authWindow.webContents.on("did-navigate", (_event, targetUrl) => {
      handleNavigation(targetUrl);
    });

    authWindow.webContents.on("did-fail-load", (_event, errorCode, errorDescription, validatedUrl) => {
      if (isCompleted || errorCode === -3) {
        return;
      }

      if (isMicrosoftAuthRedirect(validatedUrl, redirectUri)) {
        handleNavigation(validatedUrl);
        return;
      }

      reject(new Error(`No se pudo cargar la ventana de autenticación: ${errorDescription}`));
    });

    authWindow.loadURL(auth.createLink()).catch((error: unknown) => {
      reject(error instanceof Error ? error : new Error("No se pudo abrir el inicio de sesión de Microsoft"));
    });
  });

  return auth.login(authCode);
};

export const registerLauncherIpc = (window: BrowserWindow): void => {
  initDb();

  ipcMain.handle(CHANNELS.getWeeklyActivity, async () => {
    return getWeeklyActivity();
  });

  ipcMain.handle(CHANNELS.getStatistics, async () => {
    return getStatistics();
  });

  ipcMain.handle(CHANNELS.getDownloadedVersions, async () => {
    return getDownloadedVersions();
  });

  ipcMain.handle(CHANNELS.getLogo, async () => {
    return getLogo();
  });

  ipcMain.on(CHANNELS.setLogo, (_event, logo: string) => {
    setLogo(logo);
  });

  ipcMain.handle(CHANNELS.getLanguage, async () => {
    return getLanguage();
  });

  ipcMain.on(CHANNELS.setLanguage, (_event, lang: string) => {
    setLanguage(lang);
  });

  ipcMain.handle(CHANNELS.loginMicrosoft, async () => {
    try {
      const xbox = await loginWithMicrosoftPopup(window);
      const mc = await xbox.getMinecraft();
      
      const msmcToken = xbox.save();
      const mcToken = mc.mclc();
      
      // Guardar el perfil y el token en DB
      db.prepare("INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)").run('msmc_token', msmcToken);
      db.prepare("INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)").run('mc_profile', JSON.stringify(mc.profile));
      db.prepare("INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)").run('mclc_auth', JSON.stringify(mcToken));

      return {
        username: mc.profile?.name || "Player",
        uuid: mc.profile?.id || "00000000-0000-0000-0000-000000000000",
        skinUrl: resolveSkinUrl(mc.profile),
        isOnboardingCompleted: true
      };
    } catch (error: unknown) {
      const message = resolveAuthErrorMessage(error);
      if (message.includes("error.gui.closed") || message.includes("access_denied")) {
        throw new Error("Inicio de sesión cancelado por el usuario");
      }
      console.error("Error en login de Microsoft:", error);
      throw new Error(message);
    }
  });

  ipcMain.handle(CHANNELS.logoutMicrosoft, async () => {
    db.prepare("DELETE FROM app_settings WHERE key IN ('msmc_token', 'mc_profile', 'mclc_auth')").run();
    return true;
  });

  ipcMain.handle(CHANNELS.getProfile, async () => {
    const row = db.prepare("SELECT value FROM app_settings WHERE key = 'mc_profile'").get() as any;
    if (row) {
      try {
        const p = JSON.parse(row.value);
        return {
          username: p.name,
          uuid: p.id,
          skinUrl: resolveSkinUrl(p),
          isOnboardingCompleted: true
        };
      } catch {
        return null;
      }
    }
    return null;
  });

  ipcMain.handle(CHANNELS.clearCache, async () => {
    clearCache();
  });

  ipcMain.handle(CHANNELS.clearAllData, async () => {
    clearAllData();
  });

  ipcMain.on(CHANNELS.restartApp, () => {
    app.relaunch();
    app.exit(0);
  });

  ipcMain.handle(CHANNELS.getVersions, async () => {
    try {
      const res = await fetch("https://launchermeta.mojang.com/mc/game/version_manifest.json");
      const data = await res.json();
      return data.versions.filter((v: MinecraftVersion) => v.type === "release").slice(0, 50); // Get latest 50 release versions
    } catch (error) {
      console.error("Failed to fetch Minecraft versions", error);
      return [];
    }
  });

  ipcMain.on(CHANNELS.launch, async (_event: unknown, payload: LaunchPayload) => {
    emitStatus(window, "running");
    emitLog(window, `Preparando lanzamiento para ${payload.username}...`);

    // Check Java before doing anything
    if (!isJavaInstalled()) {
      emitLog(window, "Error: Java no está instalado. Instala Java 17 o superior desde https://adoptium.net y reinicia el launcher.");
      emitStatus(window, "error");
      return;
    }

    try {
      // Ensure game directory exists
      fs.mkdirSync(payload.gameDir, { recursive: true });
      const homeClientRuntime = await prepareHomeClientRuntime(window, payload);

      const launcher = new Client();

      launcher.on("progress", (e) => {
        emitProgress(window, e);
      });
      launcher.on("debug", (message) => {
        emitLog(window, String(message));
      });
      launcher.on("data", (message) => {
        const text = String(message).trim();
        if (text) {
          emitLog(window, `[minecraft] ${text}`);
        }
      });
      launcher.on("close", (code) => {
        emitLog(window, `Minecraft cerrado (código: ${code})`);
        if (code === 0) {
          addDownloadedVersion(payload.version);
        }
        emitStatus(window, "done");
      });

      const authRow = db.prepare("SELECT value FROM app_settings WHERE key = 'mclc_auth'").get() as any;
      let authorization;
      
      if (authRow) {
        authorization = JSON.parse(authRow.value);
      } else {
        // Fallback para desarrollo/offline si no hay token de microsoft
        const profileRow = db.prepare("SELECT value FROM app_settings WHERE key = 'mc_profile'").get() as any;
        let playerName = payload.username || "Player";
        if (profileRow) {
          try { playerName = JSON.parse(profileRow.value).name; } catch {}
        }
        authorization = await Authenticator.getAuth(playerName);
      }

      const opts = {
        clientPackage: undefined,
        authorization,
        root: payload.gameDir,
        version: {
          number: payload.version,
          type: "release",
          custom: homeClientRuntime.customVersionId
        },
        memory: {
          max: `${payload.memoryMb}M`,
          min: "1024M"
        },
        overrides: {
          detached: false,
        },
        window: {
          fullscreen: true,
        },
      };

      emitLog(window, `Descargando/iniciando versión ${payload.version} con ${payload.memoryMb}MB de RAM...`);
      const flavorLabel = homeClientRuntime.enabled
        ? `Fabric + ${MC_HOME_CLIENT.modId}`
        : "vanilla";

      emitLog(window, `Lanzando perfil ${payload.version} en modo ${flavorLabel} con ${payload.memoryMb}MB de RAM...`);
      const minecraftProcess = await launcher.launch(opts);
      if (!minecraftProcess) {
        throw new Error("El proceso de Minecraft no pudo iniciarse.");
      }
      emitLog(window, "Proceso de Minecraft en ejecución.");
      emitStatus(window, "playing");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error desconocido";
      emitLog(window, `Error en lanzamiento: ${message}`);
      emitStatus(window, "error");
    }
  });
};

export { CHANNELS };
