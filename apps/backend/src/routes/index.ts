// ============================================================================
// File: apps/backend/src/routes/index.ts
// Version: 1.0.0 — 2026-04-20
// Why: Central route registry. Mounts all router modules at their base paths.
//      Keeping this separate from index.ts makes it easy to see all routes
//      at a glance and add new route modules in future phases.
// Env / Identity: Backend (Express router)
// ============================================================================

import { Router } from 'express';

import authRouter from './auth.js';
import scenarioRouter from './scenarios.js';
import sessionRouter from './sessions.js';

const router = Router();

// ─── Health Check ─────────────────────────────────────────────────────────────
// Used by Docker Compose healthchecks, load balancers, and CI.
router.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'imedica-backend',
    version: process.env['npm_package_version'] ?? '0.1.0',
    timestamp: new Date().toISOString(),
  });
});

// ─── Feature Routes ───────────────────────────────────────────────────────────
router.use('/auth', authRouter);
router.use('/scenarios', scenarioRouter);
router.use('/sessions', sessionRouter);

export default router;
