import { route } from "@/server/api";
import { requireUser } from "@/server/auth/guards";
import { listSaved } from "@/server/research/service";

/** GET /api/v1/papers/saved — your reading list, newest first. */
export const GET = route(async () => listSaved(await requireUser()));
