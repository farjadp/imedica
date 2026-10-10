import type { Role } from "@/generated/prisma/enums";

/** Where each role lands after signing in. */
export function homeFor(role: Role): string {
  return role === "PARAMEDIC" ? "/app" : role === "PHYSICIAN" ? "/admin/scenarios" : "/admin";
}
