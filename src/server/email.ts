import "server-only";

import { env } from "./env";

type Mail = { to: string; subject: string; text: string };

/**
 * Sends through Resend when RESEND_API_KEY is set. Without it (local dev),
 * the message is printed to the server log so links can still be followed.
 */
export async function sendEmail(mail: Mail): Promise<void> {
  const { RESEND_API_KEY, EMAIL_FROM } = env();

  if (!RESEND_API_KEY) {
    console.info(`\n[email:dev] to=${mail.to}\nsubject: ${mail.subject}\n\n${mail.text}\n`);
    return;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: EMAIL_FROM, to: mail.to, subject: mail.subject, text: mail.text }),
  });
  if (!res.ok) {
    throw new Error(`Email delivery failed (${res.status})`);
  }
}
