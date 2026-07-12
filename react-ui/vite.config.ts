import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import path from 'node:path'

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  base: './',
  plugins: [
    react(),
    {
      name: 'api-mock-dev',
      configureServer(server) {
        server.middlewares.use('/api/v1', (_req, res, next) => {
          // En desarrollo, si el backend remoto está caído (522),
          // devolvemos respuestas vacías exitosas para no contaminar la consola.
          // Todas las rutas GET de colección devuelven arrays vacíos.
          const emptyResponse = (data: unknown) =>
            JSON.stringify({ ok: true, data })

          const url = _req.url ?? ''
          if (_req.method === 'GET' && url.includes('/banners')) {
            res.setHeader('Content-Type', 'application/json')
            res.end(emptyResponse([]))
            return
          }

          next()
        })
      },
    },
  ],

  server: {
    port: 5173,
    strictPort: true,
    // Optional safety net if someone uses relative /api paths in the browser.
    proxy: {
      '/api': {
        target: process.env.MCLAUNCH_API_BASE_URL?.trim() || 'https://my3u2eiq2b78xmirlj4l.servgrid.xyz',
        changeOrigin: true,
        secure: true,
      },
    },
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
