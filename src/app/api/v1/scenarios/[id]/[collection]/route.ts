import { route, readJson } from "@/server/api";
import { CONTENT_ROLES, HttpError, requireUser } from "@/server/auth/guards";
import { asCollection, createChild, getScenarioBrief, getScenarioForAuthor } from "@/server/scenarios/service";

type P = { id: string; collection: string };

/** GET /api/v1/scenarios/:id/:collection — authors only; learners get the brief alone. */
export const GET = route<P>(async (_req, { id, collection }) => {
  const user = await requireUser();
  const wanted = asCollection(collection);
  if (!CONTENT_ROLES.includes(user.role)) {
    await getScenarioBrief(id); // unpublished stays a 404, so it looks missing
    throw new HttpError(403, "Only physicians can read a scenario's states, actions, rules or feedback.");
  }
  return (await getScenarioForAuthor(user, id))[wanted];
});

/** POST /api/v1/scenarios/:id/:collection — add a state, action, rule or feedback note. */
export const POST = route<P>(async (req, { id, collection }) =>
  createChild(await requireUser(), id, asCollection(collection), await readJson(req)),
);
