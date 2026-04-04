import { BrowserWindow, ipcMain, app } from "electron";
import { Client, Authenticator } from "minecraft-launcher-core";
import { initDb, getWeeklyActivity, getStatistics, getDownloadedVersions, addDownloadedVersion, clearCache, clearAllData } from "./db";

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
    emitLog(window, `Preparando lanzamiento offline para ${payload.username}...`);

    try {
      const launcher = new Client();

      launcher.on("debug", (e) => emitLog(window, `[DEBUG] ${e}`));
      launcher.on("data", (e) => emitLog(window, `[DATA] ${e}`));
      launcher.on("download", (e) => emitLog(window, `[DOWNLOAD] ${e}`));
      launcher.on("progress", (e) => {
        emitLog(window, `[PROGRESS] ${e.type} - ${e.task} / ${e.total}`);
        emitProgress(window, e);
      });
      launcher.on("close", (e) => {
        emitLog(window, `[CLOSE] Minecraft cerrado (código: ${e})`);
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
        }
      };

      emitLog(window, `Iniciando versión ${payload.version} con ${payload.memoryMb}MB de RAM...`);
      await launcher.launch(opts);

      addDownloadedVersion(payload.version);
      emitLog(window, "Juego iniciado.");
      emitStatus(window, "playing");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error desconocido";
      emitLog(window, `Error en lanzamiento: ${message}`);
      emitStatus(window, "error");
    }
  });
};

export { CHANNELS };
