import { route, readJson } from "@/server/api";
import { reorderQuestions } from "@/server/assessments/authoring";
import { requireUser } from "@/server/auth/guards";

/** PUT /api/v1/assessments/:id/questions/order — { ids: [...] } */
export const PUT = route<{ id: string }>(async (req, { id }) => reorderQuestions(await requireUser(), id, await readJson(req)));
