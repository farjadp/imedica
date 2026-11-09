import { route } from "@/server/api";
import { DISCLAIMER_URL, SOURCES } from "@/server/citations/registry";

/**
 * GET /api/v1/sources — every published source Imedica's medical content cites,
 * and the disclaimer link. Public: no sign-in, nothing about the caller.
 */
export const GET = route(async () => ({ sources: Object.values(SOURCES), disclaimerUrl: DISCLAIMER_URL }));
