import { createHash, randomBytes } from "node:crypto";

/** 256-bit random token for cookies, invitations and password resets. */
export function newToken(): string {
  return randomBytes(32).toString("base64url");
}

/** Tokens are stored hashed, so a database leak doesn't hand out live sessions. */
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
