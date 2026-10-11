import { route, readJson } from "@/server/api";
import { changeAssessmentStatus } from "@/server/assessments/authoring";
import { requireUser } from "@/server/auth/guards";

/** POST /api/v1/assessments/:id/status — { action: submit | publish | unpublish | archive | restore } */
export const POST = route<{ id: string }>(async (req, { id }) =>
  changeAssessmentStatus(await requireUser(), id, await readJson(req)),
);
