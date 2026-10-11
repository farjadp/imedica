import { route } from "@/server/api";
import { requireUser } from "@/server/auth/guards";
import { importEmsMcqa } from "@/server/question-bank/service";

/** POST /api/v1/question-bank/import — download EMS-MCQA and add new questions (admins, internal only). */
export const POST = route(async () => importEmsMcqa(await requireUser()));
