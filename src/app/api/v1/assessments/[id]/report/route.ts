import { route } from "@/server/api";
import { assessmentReport } from "@/server/assessments/report";
import { requireUser } from "@/server/auth/guards";

/** GET /api/v1/assessments/:id/report?organizationId= — paired before/after change, k-anonymous. */
export const GET = route<{ id: string }>(async (req, { id }) =>
  assessmentReport(await requireUser(), id, new URL(req.url).searchParams.get("organizationId")),
);
