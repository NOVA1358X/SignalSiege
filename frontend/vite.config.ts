import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    // Required for WASM (Cross-Origin Isolation)
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'credentialless',
      'Cross-Origin-Resource-Policy': 'cross-origin',
    },
  },
  preview: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'credentialless',
      'Cross-Origin-Resource-Policy': 'cross-origin',
    },
  },
  optimizeDeps: {
    // Don't pre-bundle WASM modules
    exclude: ['@linera/client'],
  },
  // Enable top-level await for WASM
  esbuild: {
    supported: {
      'top-level-await': true,
    },
  },
  build: {
    target: 'esnext',
    // Ensure WASM files are handled correctly
    assetsInlineLimit: 0, // Don't inline any assets (important for WASM)
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'animation-vendor': ['framer-motion'],
          'dynamic-vendor': ['@dynamic-labs/sdk-react-core', '@dynamic-labs/ethereum'],
        },
      },
    },
  },
});
