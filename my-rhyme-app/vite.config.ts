import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { visualizer } from 'rollup-plugin-visualizer';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    visualizer({
      open: true,
      filename: 'bundle-analysis.html',
      gzipSize: true,
      brotliSize: true,
    }),
  ],
  build: {
    chunkSizeWarningLimit: 1000,
  },
  server: {
    proxy: {
      '/api': {
        target: 'https://my-rhyme-app-bpeavbldxq-uc.a.run.app',
        changeOrigin: true,
        secure: false, // Set to true if your backend uses a valid SSL certificate
        rewrite: (path) => path.replace(/^\/api/, '/api'),
      },
    },
  },
})
