import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// IMPORTANT: This must exactly match your GitHub repository name.
// Current repo: https://github.com/berasankhadeep20-lang/f1-pitwall-dashboard
const REPO_NAME = process.env.VITE_BASE_PATH || '/f1-pitwall-dashboard/'

export default defineConfig({
  plugins: [react()],
  base: REPO_NAME,
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
