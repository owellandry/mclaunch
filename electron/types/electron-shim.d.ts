// ========================================================
// ELECTRON.D.TS - Declaraciones de tipos extendidas
// ========================================================
// Mantiene la compatibilidad y tipado fuerte para Electron en el proyecto.

declare module "electron" {
  export interface ElectronEvent {
    preventDefault(): void;
  }

  export interface IpcRendererEvent extends ElectronEvent {}

  export interface WebContents {
    openDevTools(options?: unknown): void;
    send(channel: string, ...args: unknown[]): void;
    once(event: "did-finish-load", listener: () => void): void;
    on(event: "will-redirect", listener: (event: ElectronEvent, targetUrl: string) => void): void;
    on(event: "will-navigate", listener: (event: ElectronEvent, targetUrl: string) => void): void;
    on(event: "did-navigate", listener: (event: ElectronEvent, targetUrl: string) => void): void;
    on(
      event: "did-fail-load",
      listener: (
        event: ElectronEvent,
        errorCode: number,
        errorDescription: string,
        validatedUrl: string
      ) => void
    ): void;
  }

  export class BrowserWindow {
    constructor(options?: unknown);
    static getAllWindows(): BrowserWindow[];
    removeMenu(): void;
    loadURL(url: string): Promise<void>;
    loadFile(path: string): Promise<void>;
    maximize(): void;
    minimize(): void;
    isMaximized(): boolean;
    unmaximize(): void;
    close(): void;
    show(): void;
    isDestroyed(): boolean;
    once(event: "ready-to-show", listener: () => void): void;
    on(event: "closed", listener: () => void): void;
    webContents: WebContents;
  }

  export const app: {
    whenReady(): Promise<void>;
    on(event: string, callback: (...args: unknown[]) => void | Promise<void>): void;
    quit(): void;
    relaunch(): void;
    exit(exitCode?: number): never;
    getAppPath(): string;
    getPath(name: string): string;
    isPackaged: boolean;
    commandLine: { appendSwitch(name: string, value?: string): void };
  };

  export const Menu: { setApplicationMenu(menu: unknown | null): void };
  export const session: {
    defaultSession: {
      webRequest: {
        onHeadersReceived(
          listener: (
            details: { url: string; responseHeaders?: Record<string, string[]> },
            callback: (response: { responseHeaders: Record<string, string[]> }) => void
          ) => void
        ): void;
      };
    };
  };

  export const ipcMain: {
    on(channel: string, listener: (...args: any[]) => void): void;
    handle(channel: string, listener: (...args: any[]) => unknown): void;
  };

  export const ipcRenderer: {
    send(channel: string, ...args: unknown[]): void;
    on(channel: string, listener: (...args: any[]) => void): void;
    removeListener(channel: string, listener: (...args: any[]) => void): void;
    invoke<T = unknown>(channel: string, ...args: unknown[]): Promise<T>;
  };

  export const contextBridge: {
    exposeInMainWorld(apiKey: string, api: unknown): void;
  };
}

declare namespace NodeJS {
  interface Process {
    resourcesPath: string;
  }
}