import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  server: {
    port: 5173,
    strictPort: true,
  },

  optimizeDeps: {
    // Exclude native Node modules from Vite's dep pre-bundling.
    exclude: ['better-sqlite3'],
  },

  build: {
    // Target modern Electron / Chromium — no need for legacy transforms.
    target: 'esnext',

    // Increase the warning threshold a bit (launcher has heavier assets).
    chunkSizeWarningLimit: 800,

    rollupOptions: {
      external: ['better-sqlite3'],

      output: {
        /**
         * Manual chunk splitting — keeps vendor code in separate files so:
         *  • The app chunk is smaller and parses faster on first load.
         *  • Vendor chunks don't change between app updates, so the OS
         *    file cache keeps them warm between Electron relaunches.
         */
        manualChunks: {
          // Core React runtime (~200 KB minified)
          'vendor-react':  ['react', 'react-dom'],
          // Router — loaded early but separate from React core
          'vendor-router': ['react-router-dom'],
          // i18n — only needed after bootstrap
          'vendor-i18n':   ['i18next', 'react-i18next'],
          // State management — tiny, but isolating it avoids re-parsing
          // zustand on every app chunk rebuild during development.
          'vendor-state':  ['zustand'],
        },
      },
    },
  },
})
