import { app, BrowserWindow, ipcMain } from 'electron'
import path from 'node:path'

const isDev = Boolean(process.env.VITE_DEV_SERVER_URL)

let mainWindow: BrowserWindow | null = null

const createWindow = async (): Promise<void> => {
  mainWindow = new BrowserWindow({
    width: 1240,
    height: 820,
    minWidth: 1080,
    minHeight: 720,
    title: 'MC Launch Installer',
    frame: false,
    titleBarStyle: 'hidden',
    backgroundColor: '#0d1118',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  })

  mainWindow.removeMenu()

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  ipcMain.removeHandler('installer:get-platform')
  ipcMain.handle('installer:get-platform', () => ({
    platform: process.platform,
    arch: process.arch,
    version: app.getVersion(),
  }))

  ipcMain.removeAllListeners('window:minimize')
  ipcMain.removeAllListeners('window:maximize')
  ipcMain.removeAllListeners('window:close')

  ipcMain.on('window:minimize', () => {
    mainWindow?.minimize()
  })

  ipcMain.on('window:maximize', () => {
    if (!mainWindow) {
      return
    }

    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize()
      return
    }

    mainWindow.maximize()
  })

  ipcMain.on('window:close', () => {
    mainWindow?.close()
  })

  if (isDev) {
    await mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL!)
  } else {
    await mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'))
  }
}

app.whenReady().then(async () => {
  await createWindow()

  app.on('activate', async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      await createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
