declare module "electron" {
  export const app: {
    whenReady: () => Promise<void>;
    on: (event: string, callback: (...args: unknown[]) => void | Promise<void>) => void;
    quit: () => void;
  };

  export class BrowserWindow {
    constructor(options?: unknown);
    static getAllWindows: () => BrowserWindow[];
    removeMenu: () => void;
    loadURL: (url: string) => Promise<void>;
    loadFile: (path: string) => Promise<void>;
    webContents: {
      openDevTools: (options?: unknown) => void;
      send: (channel: string, ...args: unknown[]) => void;
    };
  }

  export const Menu: {
    setApplicationMenu: (menu: unknown | null) => void;
  };

  export const session: {
    defaultSession: {
      webRequest: {
        onHeadersReceived: (
          listener: (
            details: { responseHeaders?: Record<string, string[]> },
            callback: (response: { responseHeaders: Record<string, string[]> }) => void
          ) => void
        ) => void;
      };
    };
  };

  export type IpcRendererEvent = unknown;

  export const ipcMain: {
    on: (channel: string, listener: (...args: any[]) => void) => void;
  };

  export const ipcRenderer: {
    send: (channel: string, ...args: unknown[]) => void;
    on: (channel: string, listener: (...args: any[]) => void) => void;
    removeListener: (channel: string, listener: (...args: any[]) => void) => void;
  };

  export const contextBridge: {
    exposeInMainWorld: (apiKey: string, api: unknown) => void;
  };
}
