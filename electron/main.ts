import { app, BrowserWindow, Menu, session, ipcMain } from "electron";
import path from "node:path";
import { registerLauncherIpc } from "./ipc/launcher";

// Fix: GPU shader disk cache causes "Access denied" on Windows when the
// cache directory is locked by another process. Disable it entirely.
app.commandLine.appendSwitch("disable-gpu-shader-disk-cache");
app.commandLine.appendSwitch("disable-features", "UseSkiaRenderer");

const isDev = Boolean(process.env.VITE_DEV_SERVER_URL);

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

const createWindow = async (): Promise<void> => {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 760,
    minWidth: 960,
    minHeight: 620,
    title: "MC Launch",
    frame: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });
  mainWindow.removeMenu();
  mainWindow.maximize();

  ipcMain.on("window:minimize", () => mainWindow.minimize());
  ipcMain.on("window:maximize", () => {
    if (mainWindow.isMaximized()) mainWindow.unmaximize();
    else mainWindow.maximize();
  });
  ipcMain.on("window:close", () => mainWindow.close());

  registerLauncherIpc(mainWindow);

  if (isDev) {
    await mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL!);
    mainWindow.webContents.once("did-finish-load", () => {
      mainWindow.webContents.openDevTools({ mode: "detach" });
    });
    return;
  }

  const indexPath = path.join(__dirname, "..", "react-ui", "dist", "index.html");
  await mainWindow.loadFile(indexPath);
};

app.whenReady().then(async () => {
  Menu.setApplicationMenu(null);

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
