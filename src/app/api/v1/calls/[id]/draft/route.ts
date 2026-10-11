import { route } from "@/server/api";
import { requireUser } from "@/server/auth/guards";
import { draftScenario } from "@/server/calls/service";

/** POST /api/v1/calls/:id/draft — have Claude draft a scenario from this call, as a DRAFT owned by the physician. */
export const POST = route<{ id: string }>(async (_req, { id }) => draftScenario(await requireUser(), id));
