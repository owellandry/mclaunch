import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('installerApi', {
  getPlatform: () => ipcRenderer.invoke('installer:get-platform') as Promise<{
    platform: string
    arch: string
    version: string
  }>,
  minimizeWindow: (): void => ipcRenderer.send('window:minimize'),
  maximizeWindow: (): void => ipcRenderer.send('window:maximize'),
  closeWindow: (): void => ipcRenderer.send('window:close'),
})
