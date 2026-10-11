import { route } from "@/server/api";
import { requireUser } from "@/server/auth/guards";
import { save, unsave } from "@/server/research/service";

type P = { source: string; id: string };

/** POST /api/v1/papers/:source/:id/save — add to your reading list. */
export const POST = route<P>(async (_req, { source, id }) => save(await requireUser(), source, id));

/** DELETE /api/v1/papers/:source/:id/save — take it off. */
export const DELETE = route<P>(async (_req, { source, id }) => unsave(await requireUser(), source, id));
