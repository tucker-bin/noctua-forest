import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Minimal Vite config for Windows build issues
export default defineConfig({
  plugins: [react()],
  
  // Minimal build configuration
  build: {
    target: 'es2020',
    minify: false,
    sourcemap: false,
    chunkSizeWarningLimit: 5000,
    rollupOptions: {
      output: {
        manualChunks: undefined, // Disable chunking to reduce file operations
      },
    },
  },
  
  // Simplified dependency optimization
  optimizeDeps: {
    include: ['react', 'react-dom'],
    force: true,
  },
  
  // Reduce concurrent file operations
  server: {
    fs: {
      strict: false
    }
  }
}); 