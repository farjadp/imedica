import { route } from "@/server/api";
import { requireUser } from "@/server/auth/guards";
import { search } from "@/server/research/service";

/** GET /api/v1/papers?q=&cursor=&open=1 — search PubMed and PubMed Central. */
export const GET = route(async (req) => search(await requireUser(), new URL(req.url)));
