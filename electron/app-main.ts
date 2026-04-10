import { app, BrowserWindow, Menu, session, ipcMain, shell, screen } from "electron";
import fs from "node:fs";
import path from "node:path";
import { registerLauncherIpc } from "./ipc/launcher";
import { discordPresence } from "./services/discordPresence";
import { launcherActivitySocket } from "./services/launcherActivitySocket";
import type { DesktopRuntimePaths } from "./services/hotupdateRuntime";

const isDev = Boolean(process.env.VITE_DEV_SERVER_URL);
const shouldOpenDevTools = process.env.OPEN_ELECTRON_DEVTOOLS === "1";
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
        title: "Iniciar sesion con Microsoft",
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
      console.error("[auth-popup] Error cargando autenticacion", {
        errorCode,
        errorDescription,
        validatedUrl,
      });
    });
    childWindow.webContents.on("render-process-gone", (_event, detailsGone) => {
      console.error("[auth-popup] El renderer del popup se cerro", detailsGone);
    });
  });
};

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

const resolveWindowIconPath = (runtimePaths: DesktopRuntimePaths): string => {
  const candidates = isDev
    ? [path.join(app.getAppPath(), "react-ui", "public", "logo_slaumcher.png")]
    : [
        path.join(runtimePaths.rendererDistPath, "logo_slaumcher.png"),
        path.join(app.getAppPath(), "react-ui", "dist", "logo_slaumcher.png"),
      ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }

  return candidates[candidates.length - 1];
};

const createWindow = async (runtimePaths: DesktopRuntimePaths): Promise<void> => {
  const iconPath = resolveWindowIconPath(runtimePaths);

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 760,
    minWidth: 960,
    minHeight: 620,
    title: "Slaumcher",
    icon: iconPath,
    frame: false,
    show: false,
    autoHideMenuBar: true,
    backgroundColor: "#0f1115",
    webPreferences: {
      preload: runtimePaths.preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
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
    await mainWindow.loadFile(path.join(runtimePaths.rendererDistPath, "index.html"));
  }
};

export const startDesktopApp = async ({ runtimePaths }: { runtimePaths: DesktopRuntimePaths }): Promise<void> => {
  Menu.setApplicationMenu(null);

  const apiBaseUrl = process.env.MCLAUNCH_API_BASE_URL?.trim();
  launcherActivitySocket.start({
    apiBaseUrl,
    launcherVersion: app.getVersion(),
    onWelcomeConfig: ({ discordClientId }) => {
      void discordPresence.start({ clientId: discordClientId });
    },
  });

  if (!hasRegisteredIpc) {
    registerWindowControls();
    registerLauncherIpc(() => mainWindow);
    hasRegisteredIpc = true;
  }

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
    },
  );

  await createWindow(runtimePaths);

  app.on("activate", async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      await createWindow(runtimePaths);
    }
  });

  app.on("before-quit", () => {
    launcherActivitySocket.stop();
    discordPresence.stop();
  });

  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
  });
};
