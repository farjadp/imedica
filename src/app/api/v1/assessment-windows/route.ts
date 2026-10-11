import { route, readJson } from "@/server/api";
import { listWindows, openWindow } from "@/server/assessments/windows";
import { requireUser } from "@/server/auth/guards";

/** GET /api/v1/assessment-windows?organizationId= — published assessments and this service's windows. */
export const GET = route(async (req) => listWindows(await requireUser(), new URL(req.url).searchParams.get("organizationId")));

/** POST /api/v1/assessment-windows — { assessmentId, phase: PRE | POST, organizationId? } */
export const POST = route(async (req) => openWindow(await requireUser(), await readJson(req)));
