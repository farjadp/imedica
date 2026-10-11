import { route } from "@/server/api";
import { requireUser } from "@/server/auth/guards";
import { listCalls } from "@/server/calls/service";

/** GET /api/v1/calls?q=&source=&protocol=&page= — EMSDialog call transcripts (internal only). */
export const GET = route(async (req) => listCalls(await requireUser(), new URL(req.url)));
