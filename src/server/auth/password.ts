import bcrypt from "bcryptjs";
import { z } from "zod";

const COST = 12;

export const passwordSchema = z
  .string()
  .min(12, "Use at least 12 characters.")
  .max(128, "Use 128 characters or fewer.")
  .refine((v) => /[a-z]/i.test(v) && /\d/.test(v), "Include at least one letter and one number.");

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, COST);
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

let dummyHashPromise: Promise<string> | undefined;

// Compared against when the email doesn't exist, so response time doesn't
// reveal which addresses have accounts.
export function dummyHash(): Promise<string> {
  dummyHashPromise ??= bcrypt.hash("no-account-for-this-address", COST);
  return dummyHashPromise;
}
