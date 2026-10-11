import { route } from "@/server/api";
import { requireUser } from "@/server/auth/guards";
import { importCalls } from "@/server/calls/service";

/** POST /api/v1/calls/import — download EMSDialog and add new calls (admins, internal only). */
export const POST = route(async () => importCalls(await requireUser()));
