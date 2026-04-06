import { app, BrowserWindow, Menu, session, ipcMain } from "electron";
import path from "node:path";
import { registerLauncherIpc } from "./ipc/launcher";

// ── Startup performance flags ──────────────────────────────────────────────
// Disable GPU shader disk cache: avoids "Access denied" on Windows when the
// cache directory is locked by another process.
app.commandLine.appendSwitch("disable-gpu-shader-disk-cache");
app.commandLine.appendSwitch("disable-features", "UseSkiaRenderer");

// Keep the renderer at full CPU priority even when the window is hidden or
// another window is in front — prevents animation stutter during initial load.
app.commandLine.appendSwitch("disable-renderer-backgrounding");

// Prevent Chromium from throttling JS timers (setTimeout/setInterval) in
// background tabs/windows — keeps bootstrap logic running at full speed.
app.commandLine.appendSwitch("disable-background-timer-throttling");

const isDev = Boolean(process.env.VITE_DEV_SERVER_URL);
const rendererDistPath = path.join(__dirname, "..", "react-ui", "dist");

let mainWindow: BrowserWindow | null = null;
let hasRegisteredIpc = false;

const DEV_CSP = [
  "default-src 'self' http://localhost:5173 ws://localhost:5173",
  "script-src 'self' 'unsafe-inline' http://localhost:5173",
  "style-src 'self' 'unsafe-inline' http://localhost:5173",
  "img-src 'self' data: blob: http://localhost:5173 https://mc-heads.net https://textures.minecraft.net http://textures.minecraft.net",
  "font-src 'self' data:",
  "connect-src 'self' http://localhost:5173 ws://localhost:5173",
].join("; ");

const PROD_CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://mc-heads.net https://textures.minecraft.net http://textures.minecraft.net",
  "font-src 'self' data:",
  "connect-src 'self'",
].join("; ");

const shouldInjectAppCsp = (url: string): boolean => {
  if (isDev) {
    return url.startsWith("http://localhost:5173");
  }

  return url.startsWith("file://");
};

const registerWindowControls = (): void => {
  ipcMain.on("window:minimize", () => {
    mainWindow?.minimize();
  });

  ipcMain.on("window:maximize", () => {
    if (!mainWindow) {
      return;
    }

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
    width: 1200,
    height: 760,
    minWidth: 960,
    minHeight: 620,
    title: "MC Launch",
    frame: false,
    show: false,
    autoHideMenuBar: true,
    backgroundColor: "#0f1115",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });
  mainWindow.removeMenu();
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
  mainWindow.once("ready-to-show", () => {
    if (!mainWindow) {
      return;
    }

    mainWindow.maximize();
    mainWindow.show();

    if (isDev) {
      mainWindow.webContents.openDevTools({ mode: "detach" });
    }
  });

  if (isDev) {
    await mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL!);
    return;
  }

  await mainWindow.loadFile(path.join(rendererDistPath, "index.html"));
};

app.whenReady().then(async () => {
  Menu.setApplicationMenu(null);

  if (!hasRegisteredIpc) {
    registerWindowControls();
    registerLauncherIpc(() => mainWindow);
    hasRegisteredIpc = true;
  }

  session.defaultSession.webRequest.onHeadersReceived((details: { url: string; responseHeaders?: Record<string, string[]> }, callback: (response: { responseHeaders: Record<string, string[]> }) => void) => {
    if (!shouldInjectAppCsp(details.url)) {
      callback({
        responseHeaders: details.responseHeaders ?? {},
      });
      return;
    }

    callback({
      responseHeaders: {
        ...details.responseHeaders,
        "Content-Security-Policy": [isDev ? DEV_CSP : PROD_CSP],
      },
    });
  });

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
