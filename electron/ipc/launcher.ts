import { BrowserWindow, ipcMain, app } from "electron";
import { Client, Authenticator } from "minecraft-launcher-core";
import { execSync } from "node:child_process";
import fs from "node:fs";
import { initDb, getWeeklyActivity, getStatistics, getDownloadedVersions, addDownloadedVersion, clearCache, clearAllData } from "./db";

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
  restartApp: "app:restartApp"
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

      const launcher = new Client();

      launcher.on("progress", (e) => {
        emitProgress(window, e);
      });
      launcher.on("close", (code) => {
        emitLog(window, `Minecraft cerrado (código: ${code})`);
        if (code === 0) {
          addDownloadedVersion(payload.version);
        }
        emitStatus(window, "done");
      });

      const authOptions = await Authenticator.getAuth(payload.username);

      const opts = {
        clientPackage: undefined,
        authorization: authOptions,
        root: payload.gameDir,
        version: {
          number: payload.version,
          type: "release"
        },
        memory: {
          max: `${payload.memoryMb}M`,
          min: "1024M"
        },
        overrides: {
          detached: false,
        },
      };

      emitLog(window, `Descargando/iniciando versión ${payload.version} con ${payload.memoryMb}MB de RAM...`);
      await launcher.launch(opts);
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
