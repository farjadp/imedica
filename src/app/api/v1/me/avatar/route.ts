import { NextResponse } from "next/server";

import { route } from "@/server/api";
import { readAvatar, removeOwnAvatar, setOwnAvatar } from "@/server/account/profile";
import { HttpError, requireUser } from "@/server/auth/guards";

/** GET /api/v1/me/avatar — your profile photo. Private: only you see it. */
export const GET = route(async () => {
  const user = await requireUser();
  const avatar = await readAvatar(user.id);
  if (!avatar) throw new HttpError(404, "No photo yet.");
  return new NextResponse(Buffer.from(avatar.bytes), {
    headers: {
      "content-type": avatar.mime,
      // The URL carries ?v=<version>, so a private cache can keep it.
      "cache-control": "private, max-age=31536000, immutable",
    },
  });
});

/** POST /api/v1/me/avatar — multipart form with a `file` field. */
export const POST = route(async (req) => {
  const user = await requireUser();
  const form = await req.formData().catch(() => {
    throw new HttpError(400, "Send the photo as a form upload.");
  });
  return setOwnAvatar(user, form.get("file") as File | null);
});

/** DELETE /api/v1/me/avatar — remove your photo. */
export const DELETE = route(async () => removeOwnAvatar(await requireUser()));
