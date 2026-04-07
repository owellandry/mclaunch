/// <reference types="vite/client" />

interface Window {
  installerApi?: {
    getPlatform: () => Promise<{
      platform: string
      arch: string
      version: string
    }>
    minimizeWindow: () => void
    maximizeWindow: () => void
    closeWindow: () => void
  }
}
