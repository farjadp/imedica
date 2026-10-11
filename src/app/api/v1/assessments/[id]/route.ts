import { route, readJson } from "@/server/api";
import { deleteAssessment, getAssessment, updateAssessment } from "@/server/assessments/authoring";
import { requireUser } from "@/server/auth/guards";

type P = { id: string };

/** GET /api/v1/assessments/:id — authors get questions and answers; training leads get the outline. */
export const GET = route<P>(async (_req, { id }) => getAssessment(await requireUser(), id));

/** PATCH /api/v1/assessments/:id — edit the basics of a draft. */
export const PATCH = route<P>(async (req, { id }) => updateAssessment(await requireUser(), id, await readJson(req)));

/** DELETE /api/v1/assessments/:id — only drafts nobody has taken. */
export const DELETE = route<P>(async (_req, { id }) => deleteAssessment(await requireUser(), id));
