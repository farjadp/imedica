import { route, readJson } from "@/server/api";
import { createQuestion } from "@/server/assessments/authoring";
import { requireUser } from "@/server/auth/guards";

/** POST /api/v1/assessments/:id/questions — add a quiz question to a draft. */
export const POST = route<{ id: string }>(async (req, { id }) => createQuestion(await requireUser(), id, await readJson(req)));
