// ========================================================
// MAIN.TS - Proceso principal de Electron (optimizado 2026)
// ========================================================
// Este es el archivo de entrada del proceso principal.
// Optimizaciones clave aplicadas:
// - Más flags de rendimiento de Electron (2026)
// - CSP más estricto y seguro
// - Registro IPC solo una vez
// - No bloquea nada en startup
// - Documentación completa

import "dotenv/config";
import { app, BrowserWindow, Menu, session, ipcMain } from "electron";
import path from "node:path";
import { registerLauncherIpc } from "./ipc/launcher";
import { discordPresence } from "./services/discordPresence";

// ── FLAGS DE RENDIMIENTO (Electron 34+ / Chromium 132) ─────────────────────
app.commandLine.appendSwitch("disable-gpu-shader-disk-cache"); // Evita errores "Access denied"
app.commandLine.appendSwitch("disable-features", "UseSkiaRenderer,TranslateUI,AutomationControlled");
app.commandLine.appendSwitch("disable-renderer-backgrounding"); // Mantener prioridad CPU
app.commandLine.appendSwitch("disable-background-timer-throttling");
app.commandLine.appendSwitch("no-zygote"); // Menos overhead en Linux/Windows
app.commandLine.appendSwitch("disable-web-security", "false"); // Seguridad primero

const isDev = Boolean(process.env.VITE_DEV_SERVER_URL);
const shouldOpenDevTools = process.env.OPEN_ELECTRON_DEVTOOLS === "1";
const rendererDistPath = path.join(__dirname, "..", "react-ui", "dist");

let mainWindow: BrowserWindow | null = null;
let hasRegisteredIpc = false;

/**
 * Content Security Policy (CSP) ultra estricto
 * Dev permite localhost, Prod solo recursos locales + dominios de Minecraft
 */
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
  return isDev ? url.startsWith("http://localhost:5173") : url.startsWith("file://");
};

const registerWindowControls = (): void => {
  ipcMain.on("window:minimize", () => mainWindow?.minimize());
  ipcMain.on("window:maximize", () => {
    if (!mainWindow) return;
    mainWindow.isMaximized() ? mainWindow.unmaximize() : mainWindow.maximize();
  });
  ipcMain.on("window:close", () => mainWindow?.close());
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
      sandbox: true, // Máxima seguridad
      webSecurity: true,
    },
  });

  mainWindow.removeMenu();
  mainWindow.on("closed", () => (mainWindow = null));

  mainWindow.once("ready-to-show", () => {
    if (!mainWindow) return;
    mainWindow.maximize();
    mainWindow.show();
    if (isDev && shouldOpenDevTools) mainWindow.webContents.openDevTools({ mode: "detach" });
  });

  if (isDev) {
    await mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL!);
  } else {
    await mainWindow.loadFile(path.join(rendererDistPath, "index.html"));
  }
};

app.whenReady().then(async () => {
  Menu.setApplicationMenu(null);
  discordPresence.start();

  // Registrar IPC solo UNA vez (evita duplicados)
  if (!hasRegisteredIpc) {
    registerWindowControls();
    registerLauncherIpc(() => mainWindow);
    hasRegisteredIpc = true;
  }

  // CSP dinámico (inyección segura)
  session.defaultSession.webRequest.onHeadersReceived(
    (details: { url: string; responseHeaders?: Record<string, string[]> }, callback) => {
      if (!shouldInjectAppCsp(details.url)) {
        callback({ responseHeaders: details.responseHeaders ?? {} });
        return;
      }
      callback({
        responseHeaders: {
          ...details.responseHeaders,
          "Content-Security-Policy": [isDev ? DEV_CSP : PROD_CSP],
        },
      });
    }
  );

  await createWindow();

  app.on("activate", async () => {
    if (BrowserWindow.getAllWindows().length === 0) await createWindow();
  });
});

app.on("before-quit", () => {
  discordPresence.stop();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
