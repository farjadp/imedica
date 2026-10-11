import { readJson, route } from "@/server/api";
import { requireUser } from "@/server/auth/guards";
import { addToAssessment } from "@/server/question-bank/service";

/** POST /api/v1/question-bank/:id/add — copy a bank question into a draft assessment. */
export const POST = route<{ id: string }>(async (req, { id }) => addToAssessment(await requireUser(), id, await readJson(req)));
