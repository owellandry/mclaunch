import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  base: './',
  plugins: [react()],

  server: {
    port: 5175,
    strictPort: true,
  },

  build: {
    target: 'esnext',
    chunkSizeWarningLimit: 800,
    rollupOptions: {
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

          if (id.includes('/lucide-react/')) {
            return 'vendor-icons'
          }

          return undefined
        },
      },
    },
  },
})
