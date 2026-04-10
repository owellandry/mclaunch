import { app, BrowserWindow, ipcMain } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  getInstallState,
  getInstallerSystemProfile,
  launchInstalledApp,
  startInstallerFlow,
  type InstallerUiEvent,
} from "./installerRuntime";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isDev = Boolean(process.env.VITE_DEV_SERVER_URL);

let mainWindow: BrowserWindow | null = null;

const sendInstallerEvent = (event: InstallerUiEvent): void => {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  mainWindow.webContents.send("installer:event", event);
};

const registerInstallerIpc = (): void => {
  ipcMain.removeHandler("installer:get-platform");
  ipcMain.handle("installer:get-platform", () => getInstallerSystemProfile());

  ipcMain.removeHandler("installer:get-state");
  ipcMain.handle("installer:get-state", () => getInstallState());

  ipcMain.removeHandler("installer:start-install");
  ipcMain.handle("installer:start-install", () => startInstallerFlow(sendInstallerEvent));

  ipcMain.removeHandler("installer:launch-app");
  ipcMain.handle("installer:launch-app", async () => {
    await launchInstalledApp();
    return true;
  });

  ipcMain.removeAllListeners("window:minimize");
  ipcMain.removeAllListeners("window:maximize");
  ipcMain.removeAllListeners("window:close");

  ipcMain.on("window:minimize", () => {
    mainWindow?.minimize();
  });

  ipcMain.on("window:maximize", () => {
    if (!mainWindow) return;
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
      return;
    }
    mainWindow.maximize();
  });

  ipcMain.on("window:close", () => {
    mainWindow?.close();
  });
};

const createWindow = async (): Promise<void> => {
  mainWindow = new BrowserWindow({
    width: 860,
    height: 560,
    minWidth: 860,
    minHeight: 560,
    title: "Slaumcher Installer",
    frame: false,
    titleBarStyle: "hidden",
    backgroundColor: "#0d1118",
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  mainWindow.removeMenu();
  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  registerInstallerIpc();

  if (isDev) {
    await mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL!);
  } else {
    await mainWindow.loadFile(path.join(__dirname, "..", "dist", "index.html"));
  }
};

app.whenReady().then(async () => {
  await createWindow();

  app.on("activate", async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      await createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
