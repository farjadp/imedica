import { defineConfig } from 'tsup';

export default defineConfig({
  entry: { app: 'src/app.ts' },
  format: ['esm'],
  outDir: 'dist',
  clean: true,
  splitting: false,
  noExternal: ['@imedica/shared'],
  external: ['@prisma/client'],
});
