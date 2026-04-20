import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Replace 'f1-pitwall-dashboard' with your actual GitHub repo name
export default defineConfig({
  plugins: [react()],
  base: '/F1-Pitwall-Dashboard/',
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          charts: ['recharts'],
          motion: ['framer-motion'],
        },
      },
    },
  },
})
