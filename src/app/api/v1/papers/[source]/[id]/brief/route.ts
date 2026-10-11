import { route } from "@/server/api";
import { requireUser } from "@/server/auth/guards";
import { brief } from "@/server/research/service";

type P = { source: string; id: string };

// Reading a full paper can take a while.
export const maxDuration = 120;

/** POST /api/v1/papers/:source/:id/brief — Claude reads the paper and summarises it for practice. */
export const POST = route<P>(async (_req, { source, id }) => brief(await requireUser(), source, id));
