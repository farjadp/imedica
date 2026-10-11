import { route } from "@/server/api";
import { closeWindow } from "@/server/assessments/windows";
import { requireUser } from "@/server/auth/guards";

/** POST /api/v1/assessment-windows/:id/close */
export const POST = route<{ id: string }>(async (_req, { id }) => closeWindow(await requireUser(), id));
