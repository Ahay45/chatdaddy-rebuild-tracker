import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/chatdaddy-rebuild-tracker/',
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        roadmap: resolve(__dirname, 'roadmap.html'),
      },
    },
  },
})
