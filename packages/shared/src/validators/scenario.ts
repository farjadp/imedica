// ============================================================================
// File: packages/shared/src/validators/scenario.ts
// Version: 1.0.0 — 2026-04-20
// Why: Zod schemas for tracking scenarios, sessions, and individual decisions.
// Env / Identity: Shared
// ============================================================================

import { z } from 'zod';

export const DecisionTypeEnum = z.enum([
  'assessment',
  'medication',
  'procedure',
  'diagnosis',
  'transport',
]);

// Used to start a new simulation session
export const CreateSessionSchema = z.object({
  scenarioId: z.string().uuid('Invalid scenario ID format'),
});

export type CreateSessionDto = z.infer<typeof CreateSessionSchema>;

// Used when a user makes an actual clinical decision
export const SubmitDecisionSchema = z.object({
  decisionType: DecisionTypeEnum,
  decisionValue: z.any(), // Typically a string or a small object (e.g., { drug: "epi", dose: "0.3mg" })
  timeToDecisionMs: z.number().int().min(0),
});

export type SubmitDecisionDto = z.infer<typeof SubmitDecisionSchema>;
