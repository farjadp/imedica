// ============================================================================
// File: packages/ui/vitest.config.ts
// Version: 1.0.0 — 2026-04-22
// Why: Vitest configuration for the shared UI package.
// Env / Identity: Shared UI package
// ============================================================================

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    globals: true,
    css: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
    },
  },
});
