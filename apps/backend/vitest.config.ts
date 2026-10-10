// ============================================================================
// File: apps/backend/vitest.config.ts
// Version: 1.0.0 — 2026-04-20
// Why: Vitest configuration for backend tests. Uses in-process test runner
//      (much faster than Jest). Configured for Node environment, not browser.
// Env / Identity: Development/CI test runner
// ============================================================================

import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Run in Node environment (not jsdom)
    environment: 'node',

    // Load test env vars from .env.test if present, else fall back to .env
    envFiles: ['.env.test', '../../.env'],

    // Test file patterns
    include: ['tests/**/*.test.ts', 'src/**/*.test.ts'],

    // Coverage settings (run with --coverage flag)
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      // Must reach 60% on changed files before merge (CI enforced)
      thresholds: {
        lines: 60,
        functions: 60,
        branches: 60,
        statements: 60,
      },
      exclude: [
        'node_modules/**',
        'dist/**',
        'src/db/seeds/**',
        '**/*.d.ts',
        'vitest.config.ts',
      ],
    },

    // Timeout for individual tests (integration tests can be slow)
    testTimeout: 15000,

    // Run tests sequentially to avoid DB conflicts in integration tests
    // Change to true for pure unit tests for speed
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
  },
  resolve: {
    alias: {
      // Mirror tsconfig paths so vitest can resolve workspace packages
      '@imedica/shared': fileURLToPath(
        new URL('../../packages/shared/src/index.ts', import.meta.url),
      ),
    },
  },
});
