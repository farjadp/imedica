import { route, readJson } from "@/server/api";
import { requireUser } from "@/server/auth/guards";
import { asCollection, deleteChild, updateChild } from "@/server/scenarios/service";

type P = { id: string; collection: string; itemId: string };

/** PATCH /api/v1/scenarios/:id/:collection/:itemId */
export const PATCH = route<P>(async (req, { id, collection, itemId }) =>
  updateChild(await requireUser(), id, asCollection(collection), itemId, await readJson(req)),
);

/** DELETE /api/v1/scenarios/:id/:collection/:itemId */
export const DELETE = route<P>(async (_req, { id, collection, itemId }) =>
  deleteChild(await requireUser(), id, asCollection(collection), itemId),
);
