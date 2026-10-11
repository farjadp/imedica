import "server-only";
import { z } from "zod";

import { HttpError } from "./auth/guards";
import type { CurrentUser } from "./auth/session";
import { db } from "./db";
import { env } from "./env";

// Push notifications to the mobile app through Expo's push service. Messages
// say that something is waiting, never what: no scores, outcomes or clinical
// content leave the server this way.

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";
const CHUNK = 100;

const deviceSchema = z.object({
  token: z.string().regex(/^(Exponent|Expo)PushToken\[[^\]]+\]$/, "That isn't an Expo push token."),
  platform: z.enum(["ios", "android"]),
});

/** Registers this phone for the signed-in user. A token follows whoever signed in last. */
export async function registerDevice(user: CurrentUser, body: unknown) {
  const { token, platform } = deviceSchema.parse(body);
  await db.pushDevice.upsert({
    where: { token },
    create: { token, platform, userId: user.id },
    update: { platform, userId: user.id, lastSeenAt: new Date() },
  });
  return { registered: true };
}

/** Forgets this phone, e.g. on sign-out. Someone else's token is left alone. */
export async function unregisterDevice(user: CurrentUser, body: unknown) {
  const parsed = deviceSchema.pick({ token: true }).safeParse(body);
  if (!parsed.success) throw new HttpError(400, "Send the device's push token.");
  await db.pushDevice.deleteMany({ where: { token: parsed.data.token, userId: user.id } });
  return { unregistered: true };
}

export type PushMessage = { title: string; body: string; data?: Record<string, string> };

type Ticket = { status: "ok" | "error"; details?: { error?: string } };

/** Sends to every device of these (active) users. Never throws. */
export async function notifyUsers(userIds: string[], message: PushMessage) {
  if (!userIds.length) return;
  try {
    const devices = await db.pushDevice.findMany({
      where: { userId: { in: userIds }, user: { active: true } },
      select: { token: true },
    });
    const accessToken = env().EXPO_ACCESS_TOKEN;

    for (let i = 0; i < devices.length; i += CHUNK) {
      const batch = devices.slice(i, i + CHUNK);
      const res = await fetch(EXPO_PUSH_URL, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          accept: "application/json",
          ...(accessToken ? { authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify(batch.map((d) => ({ to: d.token, sound: "default", ...message }))),
      });
      if (!res.ok) {
        console.error("[push] expo returned", res.status);
        continue;
      }
      // Tickets come back in the order the messages went out.
      const { data } = (await res.json()) as { data: Ticket[] };
      const gone = batch.filter((_, j) => data[j]?.details?.error === "DeviceNotRegistered").map((d) => d.token);
      if (gone.length) await db.pushDevice.deleteMany({ where: { token: { in: gone } } });
    }
  } catch (error) {
    console.error("[push] send failed", error);
  }
}

/** Tells a service's paramedics that a pre- or post-test is open for them. */
export async function notifyWindowOpened(organizationId: string, phase: "PRE" | "POST", windowId: string) {
  const people = await db.user.findMany({
    where: { organizationId, role: "PARAMEDIC", active: true },
    select: { id: true },
  });
  await notifyUsers(
    people.map((p) => p.id),
    {
      title: phase === "PRE" ? "Your pre-test is open" : "Your post-test is open",
      body: "Find it at the top of your library in the Imedica app.",
      data: { type: "assessment-window", windowId },
    },
  );
}
