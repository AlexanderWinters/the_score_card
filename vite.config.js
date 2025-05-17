import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Proxy API requests to your backend server
      '/api': {
        target: 'http://localhost:3000', // Assuming your FastAPI server runs on port 3000
        changeOrigin: true,
        secure: false,
      }
    },
    host: true,
    cors: true,
    hmr: {
      host: 'developer.kknds.com'
    },
  }
})