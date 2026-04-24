// ============================================================================
// File: api/index.ts (Vercel Serverless Function entrypoint)
// Why: Vercel automatically detects files in api/ directory as serverless
//      functions. This file imports the pre-bundled Express app from dist/app.js
//      which contains all workspace dependencies already bundled by tsup.
// ============================================================================
import { app } from '../dist/app.js';

export default app;
