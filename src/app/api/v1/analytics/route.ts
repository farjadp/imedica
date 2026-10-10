import { organizationReport } from "@/server/analytics/service";
import { route } from "@/server/api";
import { requireUser } from "@/server/auth/guards";

/** GET /api/v1/analytics?organizationId=&days= — team readiness, k-anonymous. */
export const GET = route(async (req) => {
  const params = new URL(req.url).searchParams;
  const days = Math.min(365, Math.max(7, Number(params.get("days")) || 90));
  return organizationReport(await requireUser(), params.get("organizationId"), days);
});
