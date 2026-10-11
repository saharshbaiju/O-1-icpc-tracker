import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    // The Flask backend (backend/app.py) runs on port 5000. Proxying /api
    // keeps the browser on one origin, so the login cookie just works.
    proxy: {
      '/api': process.env.API_URL ?? 'http://127.0.0.1:5000',
    },
  },
})
