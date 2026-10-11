import { route } from "@/server/api";
import { describeInvite } from "@/server/auth/invitations";

/** GET /api/v1/invitations/:token — who the invitation is for, so the app can show the join screen. No sign-in. */
export const GET = route<{ token: string }>(async (_req, { token }) => describeInvite(token));
