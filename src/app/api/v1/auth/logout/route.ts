import { route } from "@/server/api";
import { destroySession } from "@/server/auth/session";

/** POST /api/v1/auth/logout — revokes the bearer token or cookie used. */
export const POST = route(async () => {
  await destroySession();
  return { signedOut: true };
});
