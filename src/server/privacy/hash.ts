import { createHmac } from "node:crypto";

// Pure helpers, kept free of `server-only` so unit tests can import them.

/** Keyed one-way hash. Without the secret, a hash can't be linked back to an id. */
export function keyedHash(secret: string, purpose: "user" | "cohort", id: string): string {
  return createHmac("sha256", secret).update(`${purpose}:${id}`).digest("hex");
}

export function experienceBucket(years: number | null | undefined): string | null {
  if (years == null) return null;
  if (years <= 2) return "0-2";
  if (years <= 5) return "3-5";
  if (years <= 10) return "6-10";
  return "10+";
}

/** Monday 00:00 UTC of the given date's week, so analytics never hold exact times. */
export function weekStart(date: Date): Date {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = d.getUTCDay();
  const diff = (day + 6) % 7;
  d.setUTCDate(d.getUTCDate() - diff);
  return d;
}

/** Minimum distinct people behind any figure shown to an organization. */
export const K_ANONYMITY = 5;
