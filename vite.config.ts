import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// Temporarily disabled PWA plugin due to workbox-build issue
// import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // PWA plugin temporarily disabled - will re-enable after fixing workbox-build issue
  ],
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', '@mui/material'],
    exclude: [],
    force: true,
    esbuildOptions: {
      target: 'es2020',
      keepNames: true
    }
  },
  build: {
    target: 'es2020',
    sourcemap: true,
    commonjsOptions: {
      transformMixedEsModules: true
    }
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      },
    },
  },
}); 