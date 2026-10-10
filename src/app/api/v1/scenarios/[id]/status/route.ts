import { route, readJson } from "@/server/api";
import { requireUser } from "@/server/auth/guards";
import { changeStatus } from "@/server/scenarios/service";

/** POST /api/v1/scenarios/:id/status — { action: submit | publish | unpublish | archive | restore } */
export const POST = route<{ id: string }>(async (req, { id }) =>
  changeStatus(await requireUser(), id, await readJson(req)),
);
