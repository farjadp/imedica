"use server";

import { revalidatePath } from "next/cache";

import type { FormState } from "@/lib/form";

import { audit } from "../../audit";
import { CONTENT_ROLES, HttpError, requireRole } from "../../auth/guards";
import { db } from "../../db";

import { installScenario } from "./install";
import { missingFromLibrary } from "./missing";

/**
 * Adds every missing library scenario as In review, authored by whoever
 * clicked, so a second physician has to read and publish each one.
 */
export async function importLibrary(): Promise<FormState> {
  try {
    const user = await requireRole(CONTENT_ROLES);
    const missing = await missingFromLibrary();
    for (const def of missing) {
      const scenario = await db.$transaction((tx) => installScenario(tx, def, { authorId: user.id, status: "IN_REVIEW" }));
      await audit(user, "scenario.create", { type: "Scenario", id: scenario.id }, { from: "library", slug: def.slug });
    }
    revalidatePath("/admin/scenarios");
    return { ok: true, message: missing.length ? `Added ${missing.length} for review.` : "Nothing new to add." };
  } catch (error) {
    if (error instanceof HttpError) return { message: error.message };
    console.error("[scenarios] library import failed", error);
    return { message: "Something went wrong. Try again." };
  }
}
