// ============================================================================
// File: packages/shared/src/validators/scenario.ts
// Version: 1.0.0 — 2026-04-22
// Why: Shared Zod validators for scenario authoring payloads.
// Env / Identity: Shared (web, mobile, backend)
// ============================================================================

import { z } from 'zod';

export const scenarioActionSchema = z.enum([
  'defibrillate',
  'cpr',
  'intubate',
  'medication',
  'assessment',
  'diagnosis',
  'transport',
  'other',
]);

export const scenarioRuleConditionSchema = z
  .object({
    action: scenarioActionSchema,
    stateOrder: z.number().int().min(0),
    maxTime: z.number().int().min(1).nullable().optional(),
    minTime: z.number().int().min(0).nullable().optional(),
    vitals: z.record(z.any()).nullable().optional(),
  })
  .superRefine((condition, ctx) => {
    if (condition.minTime !== undefined && condition.maxTime !== undefined && condition.minTime !== null && condition.maxTime !== null) {
      if (condition.minTime > condition.maxTime) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Minimum time cannot be greater than maximum time',
          path: ['minTime'],
        });
      }
    }
  });

export const createRuleSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters').max(100),
  description: z.string().nullable().optional(),
  condition: scenarioRuleConditionSchema,
  points: z.number().int().min(-100).max(100),
  feedbackKey: z.string().min(3).max(100).regex(/^[a-z_]+$/, 'Feedback key must use lowercase snake_case'),
  priority: z.number().int().min(0).max(1000).optional(),
});

export const updateRuleSchema = createRuleSchema.partial().refine((value) => Object.keys(value).length > 0, {
  message: 'At least one field is required',
});

export const createFeedbackTemplateSchema = z.object({
  key: z.string().min(3, 'Key must be at least 3 characters').max(100).regex(/^[a-z_]+$/, 'Key must use lowercase snake_case'),
  language: z.string().length(2, 'Language must be a 2-character code'),
  title: z.string().min(3, 'Title must be at least 3 characters').max(200),
  message: z.string().min(10, 'Message must be at least 10 characters').max(2000),
});

export const updateFeedbackTemplateSchema = createFeedbackTemplateSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  {
    message: 'At least one field is required',
  },
);
