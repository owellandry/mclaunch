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
import { app, BrowserWindow, Menu, session, ipcMain, shell, screen } from "electron";
import path from "node:path";
import { registerLauncherIpc } from "./ipc/launcher";
import { discordPresence } from "./services/discordPresence";
import { launcherActivitySocket } from "./services/launcherActivitySocket";

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
const configuredApiBaseUrl = process.env.MCLAUNCH_API_BASE_URL?.trim() || "https://my3u2eiq2b78xmirlj4l.servgrid.xyz";
const configuredApiOrigin = (() => {
  try {
    return new URL(configuredApiBaseUrl).origin;
  } catch {
    return "https://my3u2eiq2b78xmirlj4l.servgrid.xyz";
  }
})();
const configuredApiWsOrigin = configuredApiOrigin.replace(/^http/i, "ws");

let mainWindow: BrowserWindow | null = null;
let hasRegisteredIpc = false;

const MICROSOFT_AUTH_POPUP_NAME = "mclaunch-ms-auth";

const getSafeUrl = (value: string): URL | null => {
  try {
    return new URL(value);
  } catch {
    return null;
  }
};

const isMicrosoftAuthHost = (hostname: string): boolean => {
  return (
    hostname === "login.live.com" ||
    hostname === "account.live.com" ||
    hostname.endsWith(".live.com") ||
    hostname.endsWith(".microsoftonline.com")
  );
};

const isAllowedAuthPopupUrl = (value: string): boolean => {
  const parsed = getSafeUrl(value);
  if (!parsed) return false;
  if (parsed.origin === configuredApiOrigin) return true;
  return parsed.protocol === "https:" && isMicrosoftAuthHost(parsed.hostname);
};

const isBackendCallbackUrl = (value: string): boolean => {
  const parsed = getSafeUrl(value);
  if (!parsed) return false;
  return parsed.origin === configuredApiOrigin && parsed.pathname === "/api/v1/login/callback";
};

const registerAuthPopupSupport = (window: BrowserWindow): void => {
  window.webContents.setWindowOpenHandler(({ url, frameName }) => {
    if (frameName !== MICROSOFT_AUTH_POPUP_NAME) {
      return { action: "deny" };
    }

    if (!isAllowedAuthPopupUrl(url)) {
      return { action: "deny" };
    }

    return {
      action: "allow",
      overrideBrowserWindowOptions: {
        parent: window,
        modal: false,
        width: 520,
        height: 720,
        minWidth: 520,
        minHeight: 720,
        resizable: false,
        minimizable: false,
        maximizable: false,
        autoHideMenuBar: true,
        show: false,
        title: "Iniciar sesión con Microsoft",
        backgroundColor: "#0f1115",
        webPreferences: {
          contextIsolation: true,
          nodeIntegration: false,
          sandbox: true,
          webSecurity: true,
        },
      },
    };
  });

  window.webContents.on("did-create-window", (childWindow, details) => {
    if (details.frameName !== MICROSOFT_AUTH_POPUP_NAME) {
      childWindow.close();
      return;
    }

    childWindow.removeMenu();
    childWindow.once("ready-to-show", () => childWindow.show());

    const handlePopupNavigation = (targetUrl: string): void => {
      if (!isAllowedAuthPopupUrl(targetUrl)) {
        void shell.openExternal(targetUrl);
        if (!childWindow.isDestroyed()) childWindow.close();
        return;
      }

      if (isBackendCallbackUrl(targetUrl)) {
        setTimeout(() => {
          if (!childWindow.isDestroyed()) childWindow.close();
        }, 1200);
      }
    };

    childWindow.webContents.setWindowOpenHandler(({ url }) => {
      handlePopupNavigation(url);
      if (!isBackendCallbackUrl(url) && isAllowedAuthPopupUrl(url) && !childWindow.isDestroyed()) {
        void childWindow.loadURL(url);
      }
      return { action: "deny" };
    });

    childWindow.webContents.on("will-navigate", (event, targetUrl) => {
      if (!isAllowedAuthPopupUrl(targetUrl)) {
        event.preventDefault();
        handlePopupNavigation(targetUrl);
      }
    });
    childWindow.webContents.on("did-navigate", (_event, targetUrl) => handlePopupNavigation(targetUrl));
    childWindow.webContents.on("did-redirect-navigation", (_event, targetUrl) => handlePopupNavigation(targetUrl));
    childWindow.webContents.on("did-fail-load", (_event, errorCode, errorDescription, validatedUrl) => {
      if (errorCode === -3) return;
      console.error("[auth-popup] Error cargando autenticación", {
        errorCode,
        errorDescription,
        validatedUrl,
      });
    });
    childWindow.webContents.on("render-process-gone", (_event, detailsGone) => {
      console.error("[auth-popup] El renderer del popup se cerró", detailsGone);
    });
  });
};

/**
 * Content Security Policy (CSP) ultra estricto
 * Dev permite localhost, Prod solo recursos locales + dominios de Minecraft
 */
const DEV_CSP = [
  "default-src 'self' http://localhost:5173 ws://localhost:5173",
  "script-src 'self' 'unsafe-inline' http://localhost:5173",
  "style-src 'self' 'unsafe-inline' http://localhost:5173",
  `img-src 'self' data: blob: http://localhost:5173 https: ${configuredApiOrigin}`,
  "font-src 'self' data:",
  `connect-src 'self' http://localhost:5173 ws://localhost:5173 ${configuredApiOrigin} ${configuredApiWsOrigin}`,
].join("; ");

const PROD_CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: https: ${configuredApiOrigin}`,
  "font-src 'self' data:",
  `connect-src 'self' ${configuredApiOrigin} ${configuredApiWsOrigin}`,
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

const resizeWindowToHalfScreen = (window: BrowserWindow): void => {
  const display = screen.getDisplayMatching(window.getBounds());
  const { width, height, x, y } = display.workArea;
  const targetWidth = Math.max(960, Math.floor(width / 2));
  const targetHeight = Math.max(620, Math.floor(height / 2));
  const targetX = x + Math.floor((width - targetWidth) / 2);
  const targetY = y + Math.floor((height - targetHeight) / 2);

  window.setBounds({
    x: targetX,
    y: targetY,
    width: targetWidth,
    height: targetHeight,
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
      sandbox: true, // Máxima seguridad
      webSecurity: true,
    },
  });

  mainWindow.removeMenu();
  mainWindow.on("closed", () => (mainWindow = null));
  registerAuthPopupSupport(mainWindow);

  mainWindow.once("ready-to-show", () => {
    if (!mainWindow) return;
    resizeWindowToHalfScreen(mainWindow);
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
  const apiBaseUrl = process.env.MCLAUNCH_API_BASE_URL?.trim();
  launcherActivitySocket.start({
    apiBaseUrl,
    launcherVersion: app.getVersion(),
    onWelcomeConfig: ({ discordClientId }) => {
      void discordPresence.start({ clientId: discordClientId });
    },
  });

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
  launcherActivitySocket.stop();
  discordPresence.stop();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
