import "server-only";
import { headers } from "next/headers";

import { hashToken } from "./auth/tokens";
import { db } from "./db";

// Fixed-window limiter kept in Postgres, so every app instance shares one count.
// Keys are hashed before they're stored: "login:<email>" must not leave an
// address behind in the identity schema.

export async function clientIp(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
}

/** Returns true when the caller is over the limit. */
export async function limited(key: string, max: number, windowMs: number): Promise<boolean> {
  const rows = await db.$queryRaw<{ count: number }[]>`
    INSERT INTO "identity"."RateLimitBucket" ("key", "count", "resetAt")
    VALUES (${hashToken(key)}, 1, now() + make_interval(secs => ${windowMs / 1000}))
    ON CONFLICT ("key") DO UPDATE SET
      "count" = CASE WHEN "RateLimitBucket"."resetAt" < now() THEN 1 ELSE "RateLimitBucket"."count" + 1 END,
      "resetAt" = CASE WHEN "RateLimitBucket"."resetAt" < now() THEN EXCLUDED."resetAt" ELSE "RateLimitBucket"."resetAt" END
    RETURNING "count"`;

  // Expired buckets are dead weight; sweep them now and then.
  if (Math.random() < 0.01) {
    await db.rateLimitBucket.deleteMany({ where: { resetAt: { lt: new Date() } } });
  }
  return rows[0].count > max;
}
