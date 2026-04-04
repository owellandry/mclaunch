import { BrowserWindow, ipcMain } from "electron";

export type LaunchPayload = {
  username: string;
  version: string;
  memoryMb: number;
  gameDir: string;
};

const CHANNELS = {
  launch: "launcher:launch",
  log: "launcher:log",
  status: "launcher:status",
} as const;

const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

const emitLog = (window: BrowserWindow, message: string): void => {
  window.webContents.send(CHANNELS.log, message);
};

const emitStatus = (window: BrowserWindow, status: "idle" | "running" | "done" | "error"): void => {
  window.webContents.send(CHANNELS.status, status);
};

export const registerLauncherIpc = (window: BrowserWindow): void => {
  ipcMain.on(CHANNELS.launch, async (_event, payload: LaunchPayload) => {
    emitStatus(window, "running");
    emitLog(window, `Preparando lanzamiento offline para ${payload.username}...`);

    try {
      await delay(350);
      emitLog(window, `Version seleccionada: ${payload.version}`);
      await delay(350);
      emitLog(window, `RAM asignada: ${payload.memoryMb} MB`);
      await delay(350);
      emitLog(window, `Directorio del juego: ${payload.gameDir}`);
      await delay(500);
      emitLog(window, "Resolviendo assets locales...");
      await delay(500);
      emitLog(window, "Lanzamiento simulado completado. Listo para integrar minecraft-launcher-core.");
      emitStatus(window, "done");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error desconocido";
      emitLog(window, `Error en simulacion: ${message}`);
      emitStatus(window, "error");
    }
  });
};

export { CHANNELS };
