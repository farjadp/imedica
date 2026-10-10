import { route, readJson } from "@/server/api";
import { requireUser } from "@/server/auth/guards";
import { deleteScenario, getScenarioFull, updateScenario } from "@/server/scenarios/service";

type P = { id: string };

/** GET /api/v1/scenarios/:id — authors get rules and publish problems; learners don't. */
export const GET = route<P>(async (_req, { id }) => getScenarioFull(await requireUser(), id));

/** PATCH /api/v1/scenarios/:id — edit the basics of a draft. */
export const PATCH = route<P>(async (req, { id }) => updateScenario(await requireUser(), id, await readJson(req)));

/** DELETE /api/v1/scenarios/:id — only drafts nobody has run. */
export const DELETE = route<P>(async (_req, { id }) => deleteScenario(await requireUser(), id));
