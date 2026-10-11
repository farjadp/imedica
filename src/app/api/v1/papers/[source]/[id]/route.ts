import { route } from "@/server/api";
import { requireUser } from "@/server/auth/guards";
import { detail } from "@/server/research/service";

type P = { source: string; id: string };

/** GET /api/v1/papers/:source/:id — the paper, its abstract, and a summary if one exists. */
export const GET = route<P>(async (_req, { source, id }) => detail(await requireUser(), source, id));
