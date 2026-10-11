import { z } from "zod";

// Shared by the editor (client) and the API (server).

export const CATEGORIES = [
  "CARDIAC",
  "RESPIRATORY",
  "NEUROLOGICAL",
  "TRAUMA",
  "TOXICOLOGY",
  "ENVIRONMENTAL",
  "OBSTETRIC",
  "PEDIATRIC",
  "ALLERGIC",
  "METABOLIC",
] as const;
export const DIFFICULTIES = ["FOUNDATIONAL", "INTERMEDIATE", "ADVANCED"] as const;
export const ACTION_CATEGORIES = [
  "ASSESSMENT",
  "AIRWAY",
  "BREATHING",
  "CIRCULATION",
  "MEDICATION",
  "PROCEDURE",
  "TRANSPORT",
  "COMMUNICATION",
] as const;
export const OUTCOMES = ["CORRECT", "ACCEPTABLE", "SUBOPTIMAL", "HARMFUL", "CRITICAL"] as const;

export const text = (min: number, max: number, what: string) =>
  z
    .string({ error: `${what} is required.` })
    .trim()
    .min(min, min <= 1 ? `${what} is required.` : `${what} needs at least ${min} characters.`)
    .max(max, `${what} must be ${max} characters or fewer.`);
export const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .nullable()
    .transform((v) => (v ? v : null));

export const scenarioSchema = z.object({
  title: text(3, 120, "Title"),
  summary: text(10, 400, "Summary"),
  dispatch: text(10, 1000, "Dispatch"),
  category: z.enum(CATEGORIES),
  difficulty: z.enum(DIFFICULTIES),
  timeLimitSec: z.coerce.number().int().min(120, "At least 2 minutes.").max(3600, "At most 60 minutes."),
  learningGoals: z.array(z.string().trim().min(1).max(200)).max(8).default([]),
  protocolSource: optionalText(300),
});
export const scenarioPatchSchema = scenarioSchema.partial();

const vital = z.coerce.number().finite().optional().nullable();
export const vitalsSchema = z.object({
  hr: vital,
  sbp: vital,
  dbp: vital,
  rr: vital,
  spo2: vital,
  etco2: vital,
  gcs: vital,
  temp: vital,
  glucose: vital,
  rhythm: z.enum(["sinus", "tachycardia", "stemi", "bradycardia", "vfib", "asystole"]).optional().nullable(),
  skin: optionalText(80),
});
export type Vitals = {
  hr?: number | null;
  sbp?: number | null;
  dbp?: number | null;
  rr?: number | null;
  spo2?: number | null;
  etco2?: number | null;
  gcs?: number | null;
  temp?: number | null;
  glucose?: number | null;
  rhythm?: "sinus" | "tachycardia" | "stemi" | "bradycardia" | "vfib" | "asystole" | null;
  skin?: string | null;
};

export const stateSchema = z.object({
  title: text(2, 120, "Title"),
  narrative: text(5, 2000, "Narrative"),
  vitals: vitalsSchema,
  isStart: z.boolean().default(false),
  isTerminal: z.boolean().default(false),
  debrief: optionalText(2000),
});
export const statePatchSchema = stateSchema.partial();

export const actionSchema = z.object({
  category: z.enum(ACTION_CATEGORIES),
  label: text(2, 120, "Label"),
  detail: optionalText(200),
});
export const actionPatchSchema = actionSchema.partial();

const id = z.string().min(1);
export const ruleSchema = z.object({
  fromStateId: id.nullable(),
  actionId: id,
  outcome: z.enum(OUTCOMES),
  points: z.coerce.number().int().min(-100).max(100),
  toStateId: id.nullable(),
  withinSec: z.coerce.number().int().min(1).max(3600).nullable(),
  rationale: text(5, 500, "Rationale"),
  feedbackId: id.nullable(),
  priority: z.coerce.number().int().min(0).max(1000).default(100),
  required: z.boolean().default(false),
});
export const rulePatchSchema = ruleSchema.partial();

export const feedbackSchema = z.object({
  title: text(2, 120, "Title"),
  body: text(10, 4000, "Body"),
  reference: optionalText(300),
});
export const feedbackPatchSchema = feedbackSchema.partial();

export const reorderSchema = z.object({ ids: z.array(id).min(1).max(200) });

export const statusChangeSchema = z.object({
  action: z.enum(["submit", "publish", "unpublish", "archive", "restore"]),
});
