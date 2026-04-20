// ============================================================================
// File: apps/backend/src/routes/scenarios.ts
// Version: 1.0.0 — 2026-04-20
// Why: Defines Express routes for accessing published scenarios.
// Env / Identity: Backend (Express Router)
// ============================================================================

import { Router } from 'express';
import { scenarioService } from '../services/scenario/ScenarioService.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Retrieve all published scenarios
router.get('/', authenticate, async (req, res, next) => {
  try {
    const scenarios = await scenarioService.listPublishedScenarios();
    res.status(200).json({ success: true, data: scenarios });
  } catch (err) {
    next(err);
  }
});

// Retrieve a specific scenario with states
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const scenario = await scenarioService.getScenario(req.params.id);
    res.status(200).json({ success: true, data: scenario });
  } catch (err) {
    next(err);
  }
});

export default router;
