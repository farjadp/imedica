import { route } from "@/server/api";
import { requireUser } from "@/server/auth/guards";
import { searchBank } from "@/server/question-bank/service";

/** GET /api/v1/question-bank?q=&level=&category=&page= — search imported questions (internal only). */
export const GET = route(async (req) => searchBank(await requireUser(), new URL(req.url)));
