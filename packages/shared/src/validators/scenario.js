"use strict";
// ============================================================================
// File: packages/shared/src/validators/scenario.ts
// Version: 1.0.0 — 2026-04-20
// Why: Zod schemas for tracking scenarios, sessions, and individual decisions.
// Env / Identity: Shared
// ============================================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubmitDecisionSchema = exports.CreateSessionSchema = exports.DecisionTypeEnum = void 0;
const zod_1 = require("zod");
exports.DecisionTypeEnum = zod_1.z.enum([
    'assessment',
    'medication',
    'procedure',
    'diagnosis',
    'transport',
]);
// Used to start a new simulation session
exports.CreateSessionSchema = zod_1.z.object({
    scenarioId: zod_1.z.string().uuid('Invalid scenario ID format'),
});
// Used when a user makes an actual clinical decision
exports.SubmitDecisionSchema = zod_1.z.object({
    decisionType: exports.DecisionTypeEnum,
    decisionValue: zod_1.z.any(), // Typically a string or a small object (e.g., { drug: "epi", dose: "0.3mg" })
    timeToDecisionMs: zod_1.z.number().int().min(0),
});
//# sourceMappingURL=scenario.js.map