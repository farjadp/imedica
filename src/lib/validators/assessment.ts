import { z } from "zod";

import { optionalText, text } from "./scenario";

// Shared by the assessment editor (client) and the API (server).

export const assessmentSchema = z.object({
  title: text(3, 120, "Title"),
  summary: text(10, 400, "Summary"),
  scenarioIds: z.array(z.string().min(1)).max(10, "Ten scenarios at most.").default([]),
});
export const assessmentPatchSchema = assessmentSchema.partial();

const questionFields = z.object({
  stem: text(5, 600, "Question"),
  options: z
    .array(z.string().trim().min(1, "Options can't be empty.").max(300))
    .min(2, "Give at least two options.")
    .max(6, "Six options at most."),
  correctIndex: z.coerce.number().int().min(0),
  rationale: text(5, 1000, "Rationale"),
  reference: optionalText(300),
});

export const questionSchema = questionFields.refine((q) => q.correctIndex < q.options.length, {
  message: "Choose the correct answer from the options.",
  path: ["correctIndex"],
});
// A patch is checked against the stored question after merging.
export const questionPatchSchema = questionFields.partial();

export const questionOrderSchema = z.object({ ids: z.array(z.string().min(1)).min(1).max(100) });

export const answerSchema = z.object({ questionId: z.string().min(1), choice: z.coerce.number().int().min(0) });
