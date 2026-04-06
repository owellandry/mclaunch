import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  base: './',
  plugins: [react()],

  server: {
    port: 5173,
    strictPort: true,
  },

  optimizeDeps: {
    exclude: ['better-sqlite3'],
  },

  build: {
    target: 'esnext',
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      external: ['better-sqlite3'],
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) {
            return undefined
          }

          if (id.includes('/react/') || id.includes('/react-dom/')) {
            return 'vendor-react'
          }

          if (id.includes('/react-router-dom/')) {
            return 'vendor-router'
          }

          if (id.includes('/i18next/') || id.includes('/react-i18next/')) {
            return 'vendor-i18n'
          }

          if (id.includes('/zustand/')) {
            return 'vendor-state'
          }

          return undefined
        },
      },
    },
  },
})
