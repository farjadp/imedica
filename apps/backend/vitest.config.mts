// ============================================================================
// File: apps/backend/vitest.config.mts
// Version: 1.0.7 — 2026-04-20
// Why: v1.7: Uses absolute alias paths for all src/* imports to avoid Vite's
//      URL encoding issue with paths containing spaces (Google Drive path).
//      Test files should import `@backend/lib/errors` instead of `../../src/lib/errors`.
// Env / Identity: Development/CI test runner
// ============================================================================

import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const backendDir = fileURLToPath(new URL('.', import.meta.url));
const monorepoRoot = resolve(backendDir, '../..');

export default defineConfig({
  test: {
    environment: 'node',
    envFiles: [resolve(backendDir, '../../.env')],
    include: ['tests/**/*.test.ts', 'src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      thresholds: { lines: 60, functions: 60, branches: 60, statements: 60 },
      exclude: ['node_modules/**', 'dist/**', 'src/db/seeds/**', '**/*.d.ts', 'vitest.config.mts'],
    },
    testTimeout: 15000,
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.mts', '.js', '.jsx', '.mjs', '.json'],
    alias: [
      // Workspace package
      { find: '@imedica/shared', replacement: resolve(monorepoRoot, 'packages/shared/src/index.ts') },
      // Absolute alias for backend src — avoids path-with-spaces URL encoding issue
      { find: '@backend', replacement: resolve(backendDir, 'src') },
      // NodeNext .js → strip extension (let Vite find the .ts)
      { find: /^(\.{1,2}\/.+)\.js$/, replacement: '$1' },
    ],
  },
});
