// ============================================================================
// File: apps/backend/src/routes/index.ts
// Version: 1.0.0 — 2026-04-20
// Why: Central route registry. Mounts all router modules at their base paths.
//      Keeping this separate from index.ts makes it easy to see all routes
//      at a glance and add new route modules in future phases.
// Env / Identity: Backend (Express router)
// ============================================================================

import type { Router as ExpressRouter } from 'express';
import { Router } from 'express';

import authRouter from './auth.js';
import usersRouter from './users.js';

const router: ExpressRouter = Router();

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
// Phase 1: Auth only. More routes added in subsequent phases.

router.use('/auth', authRouter);
router.use('/users', usersRouter);

// Phase 2+ routes will be added here:
// router.use('/scenarios', scenarioRouter);       // Phase 3
// router.use('/sessions', sessionRouter);          // Phase 4
// router.use('/feedback', feedbackRouter);         // Phase 5
// router.use('/admin', adminRouter);               // Phase 6

export default router;
