import { defineConfig } from 'tsup';

export default defineConfig({
  // Entry named 'index' → outputs dist/index.js (matches Vercel's /index.js route)
  entry: { index: 'src/app.ts' },
  format: ['esm'],
  outDir: 'dist',
  clean: true,
  splitting: false,
  // Bundle @imedica/shared into the output (monorepo dep not available on Vercel)
  noExternal: ['@imedica/shared'],
  // Prisma client uses native binaries — must stay external
  external: ['@prisma/client'],
});
