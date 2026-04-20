// ============================================================================
// File: apps/backend/src/routes/sessions.ts
// Version: 1.0.0 — 2026-04-20
// Why: Express routes routing for runtime simulation tracking and decisions.
// Env / Identity: Backend (Express Router)
// ============================================================================

import { Router } from 'express';
import { CreateSessionSchema, SubmitDecisionSchema } from '@imedica/shared';
import { sessionService } from '../services/session/SessionService.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Start a new session
router.post('/', authenticate, async (req, res, next) => {
  try {
    const dto = CreateSessionSchema.parse(req.body);
    const result = await sessionService.createSession(req.user!.sub, dto);
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

// Submit a clinical decision
router.post('/:id/decisions', authenticate, async (req, res, next) => {
  try {
    const dto = SubmitDecisionSchema.parse(req.body);
    const result = await sessionService.submitDecision(req.user!.sub, req.params.id, dto);
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

// Retrieve final results
router.get('/:id/results', authenticate, async (req, res, next) => {
  try {
    const result = await sessionService.getResults(req.user!.sub, req.params.id);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

export default router;
