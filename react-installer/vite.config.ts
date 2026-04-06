import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  base: './',
  plugins: [react()],
  server: {
    port: 5174,
    strictPort: true,
  },
  build: {
    target: 'esnext',
    emptyOutDir: true,
  },
})
