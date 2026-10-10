"use server";

import { redirect } from "next/navigation";

import { HttpError, requireUser } from "../auth/guards";
import { startSession } from "./service";

/** Starts a run and goes straight to it. Used by the library's start button. */
export async function startRun(formData: FormData) {
  const user = await requireUser();
  const scenarioId = String(formData.get("scenarioId") ?? "");
  let id: string;
  try {
    ({ id } = await startSession(user, scenarioId));
  } catch (error) {
    if (error instanceof HttpError) redirect(`/app/scenarios?error=${encodeURIComponent(error.message)}`);
    throw error;
  }
  redirect(`/run/${id}`);
}
