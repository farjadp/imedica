import { route, readJson } from "@/server/api";
import { createAssessment, listAssessments } from "@/server/assessments/authoring";
import { requireUser } from "@/server/auth/guards";

/** GET /api/v1/assessments — every status for authors; published for training leads. */
export const GET = route(async () => listAssessments(await requireUser()));

/** POST /api/v1/assessments — create a draft. */
export const POST = route(async (req) => createAssessment(await requireUser(), await readJson(req)));
