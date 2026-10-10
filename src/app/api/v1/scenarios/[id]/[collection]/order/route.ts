import { route, readJson } from "@/server/api";
import { requireUser } from "@/server/auth/guards";
import { asCollection, reorderChildren } from "@/server/scenarios/service";

/** PUT /api/v1/scenarios/:id/:collection/order — { ids: [...] } for states or actions. */
export const PUT = route<{ id: string; collection: string }>(async (req, { id, collection }) =>
  reorderChildren(await requireUser(), id, asCollection(collection), await readJson(req)),
);
