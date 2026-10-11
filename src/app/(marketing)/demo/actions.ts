"use server";

import { site } from "@/lib/site";
import { z } from "zod";

import { type FormState, fieldErrors } from "@/lib/form";
import { audit } from "@/server/audit";
import { db } from "@/server/db";
import { clientIp, limited } from "@/server/rate-limit";

const schema = z.object({
  name: z.string().trim().min(2, "Enter your name.").max(120),
  email: z.string().trim().toLowerCase().email("Enter a work email we can reply to."),
  organization: z.string().trim().min(2, "Enter your service or organization.").max(160),
  role: z.string().trim().min(2, "Enter your role.").max(120),
  teamSize: z.enum(["1-20", "21-100", "101-500", "500+"], { message: "Choose a team size." }),
  message: z.string().trim().max(2000).optional(),
  // Honeypot: real people never see or fill this.
  website: z.string().max(0).optional(),
});

export async function requestDemo(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { fieldErrors: fieldErrors(parsed.error), message: "Check the highlighted fields." };
  }
  const { website, ...data } = parsed.data;
  if (website) return { ok: true };
  if (await limited(`demo:${await clientIp()}`, 5, 60 * 60_000)) {
    return { message: "We've received several requests from you already. We'll be in touch." };
  }

  try {
    const lead = await db.demoRequest.create({ data: { ...data, message: data.message || null } });
    await audit(null, "demo.request", { type: "DemoRequest", id: lead.id });
    return { ok: true };
  } catch (error) {
    console.error("[demo] save failed", error);
    return { message: `We couldn't send that just now. Try again, or email ${site.contactEmail}.` };
  }
}
