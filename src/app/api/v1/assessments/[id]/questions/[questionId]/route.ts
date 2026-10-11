import { route, readJson } from "@/server/api";
import { deleteQuestion, updateQuestion } from "@/server/assessments/authoring";
import { requireUser } from "@/server/auth/guards";

type P = { id: string; questionId: string };

/** PATCH /api/v1/assessments/:id/questions/:questionId */
export const PATCH = route<P>(async (req, { id, questionId }) =>
  updateQuestion(await requireUser(), id, questionId, await readJson(req)),
);

/** DELETE /api/v1/assessments/:id/questions/:questionId */
export const DELETE = route<P>(async (_req, { id, questionId }) => deleteQuestion(await requireUser(), id, questionId));
