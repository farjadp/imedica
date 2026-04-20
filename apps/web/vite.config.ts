// ============================================================================
// File: apps/web/vite.config.ts
// Version: 1.0.0 — 2026-04-20
// Why: Vite build config for the web app. Proxies /api/* to the backend
//      in development to avoid CORS issues during local dev.
// Env / Identity: Web (Vite build tool)
// ============================================================================

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@imedica/shared': path.resolve(__dirname, '../../packages/shared/src/index.ts'),
    },
  },

  server: {
    port: 5173,
    // Proxy /api/* to the backend (avoids CORS issues in local dev)
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },

  build: {
    outDir: 'dist',
    sourcemap: true,
    // Split vendor chunks for better caching
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          query: ['@tanstack/react-query'],
        },
      },
    },
  },
});
