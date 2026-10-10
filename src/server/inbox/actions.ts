"use server";

import { z } from "zod";

import { type FormState, fieldErrors } from "@/lib/form";
import { CONTACT_TOPICS, TRACKS } from "@/lib/inbox";
import { site } from "@/lib/site";

import { audit } from "../audit";
import { db } from "../db";
import { sendEmail } from "../email";
import { clientIp, limited } from "../rate-limit";

const email = z.string().trim().toLowerCase().email("Enter an email we can reply to.");
// Honeypot: real people never see or fill this.
const honeypot = z.string().max(0).optional();

const schemas = {
  CONTACT: z.object({
    name: z.string().trim().min(2, "Enter your name.").max(120),
    email,
    organization: z.string().trim().max(160).optional(),
    topic: z.enum(CONTACT_TOPICS, { message: "Choose a topic." }),
    message: z.string().trim().min(10, "Tell us a little more (10+ characters).").max(4000),
    website: honeypot,
  }),
  CAREERS: z.object({
    name: z.string().trim().min(2, "Enter your name.").max(120),
    email,
    topic: z.enum(TRACKS, { message: "Choose a track." }),
    links: z.string().trim().min(6, "Add a LinkedIn, GitHub or portfolio link.").max(500),
    message: z.string().trim().min(20, "Tell us why (20+ characters).").max(4000),
    website: honeypot,
  }),
  APP_WAITLIST: z.object({
    email,
    topic: z.enum(["iPhone", "Android"], { message: "Choose your phone." }),
    website: honeypot,
  }),
} as const;

type Kind = keyof typeof schemas;

const subjects: Record<Kind, string> = {
  CONTACT: "New contact message",
  CAREERS: "New careers application",
  APP_WAITLIST: "New app launch sign-up",
};

async function submit(kind: Kind, formData: FormData): Promise<FormState> {
  const parsed = schemas[kind].safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error), message: "Check the highlighted fields." };
  const { website, ...data } = parsed.data as Record<string, string | undefined>;
  if (website) return { ok: true };
  if (limited(`inbox:${kind}:${await clientIp()}`, 5, 60 * 60_000)) {
    return { message: `We've already received several messages from you. We'll be in touch, or email ${site.contactEmail}.` };
  }

  try {
    const msg = await db.inboundMessage.create({
      data: {
        kind,
        email: data.email!,
        name: data.name || null,
        organization: data.organization || null,
        topic: data.topic || null,
        message: data.message || null,
        links: data.links || null,
      },
    });
    await audit(null, "inbox.receive", { type: "InboundMessage", id: msg.id }, { kind });
    // The inbox in the admin is the record; email is only a nudge.
    try {
      await sendEmail({
        to: site.contactEmail,
        subject: `${subjects[kind]}${data.topic ? ` · ${data.topic}` : ""}`,
        text: [
          data.name ? `From: ${data.name} <${data.email}>` : `From: ${data.email}`,
          data.organization ? `Organization: ${data.organization}` : null,
          data.links ? `Links: ${data.links}` : null,
          data.message ? `\n${data.message}` : null,
          "\nReply from your mail client, then mark it handled in Admin → Inbox.",
        ]
          .filter(Boolean)
          .join("\n"),
      });
    } catch (error) {
      console.error("[inbox] notification email failed", error);
    }
    return { ok: true };
  } catch (error) {
    console.error("[inbox] save failed", error);
    return { message: `We couldn't send that just now. Try again, or email ${site.contactEmail}.` };
  }
}

export async function sendContact(_prev: FormState, formData: FormData) {
  return submit("CONTACT", formData);
}
export async function applyForRole(_prev: FormState, formData: FormData) {
  return submit("CAREERS", formData);
}
export async function joinAppWaitlist(_prev: FormState, formData: FormData) {
  return submit("APP_WAITLIST", formData);
}
