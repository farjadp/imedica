import { route, readJson } from "@/server/api";
import { requireUser } from "@/server/auth/guards";
import { asCollection, createChild, getScenarioFull } from "@/server/scenarios/service";

type P = { id: string; collection: string };

/** GET /api/v1/scenarios/:id/:collection */
export const GET = route<P>(async (_req, { id, collection }) => {
  const full = await getScenarioFull(await requireUser(), id);
  return full[asCollection(collection)];
});

/** POST /api/v1/scenarios/:id/:collection — add a state, action, rule or feedback note. */
export const POST = route<P>(async (req, { id, collection }) =>
  createChild(await requireUser(), id, asCollection(collection), await readJson(req)),
);
