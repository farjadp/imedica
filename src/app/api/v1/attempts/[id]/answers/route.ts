import { route, readJson } from "@/server/api";
import { answerQuestion } from "@/server/assessments/taking";
import { requireUser } from "@/server/auth/guards";

/** POST /api/v1/attempts/:id/answers — { questionId, choice } */
export const POST = route<{ id: string }>(async (req, { id }) => answerQuestion(await requireUser(), id, await readJson(req)));
