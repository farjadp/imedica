"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import type { FormState } from "@/lib/form";

import { audit } from "../audit";
import { HttpError, requireRole } from "../auth/guards";
import { db } from "../db";

export async function setMessageHandled(_prev: FormState, formData: FormData): Promise<FormState> {
  try {
    const user = await requireRole(["ADMIN"]);
    const id = z.string().parse(formData.get("id"));
    const handled = formData.get("handled") === "true";
    await db.inboundMessage.update({ where: { id }, data: { handled } });
    await audit(user, "inbox.handle", { type: "InboundMessage", id }, { handled });
    revalidatePath("/admin/inbox");
    return { ok: true };
  } catch (error) {
    if (error instanceof HttpError) return { message: error.message };
    console.error("[inbox] update failed", error);
    return { message: "Something went wrong. Try again." };
  }
}
