import type { Metadata } from "next";
import Link from "next/link";

import { hashToken } from "@/server/auth/tokens";
import { db } from "@/server/db";

import { AcceptForm } from "./accept-form";

export const metadata: Metadata = { title: "Join your team", robots: { index: false } };

const roleNames = { PARAMEDIC: "paramedic", INSTRUCTOR: "instructor", PHYSICIAN: "physician", ADMIN: "administrator" };

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const invite = await db.invitation.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { organization: { select: { name: true } } },
  });

  if (!invite || invite.acceptedAt || invite.expiresAt < new Date()) {
    return (
      <>
        <h1 className="font-display text-[2.2rem] leading-tight font-medium tracking-[-0.02em] text-ink">
          This invitation can&apos;t be used
        </h1>
        <p className="mt-4 text-[15px] leading-relaxed text-ink-2">
          It may have expired after seven days, or already been accepted. Ask your training lead to send a new one, or{" "}
          <Link href="/login" className="text-pine-3 underline">
            sign in
          </Link>{" "}
          if you already have an account.
        </p>
      </>
    );
  }

  return (
    <>
      <h1 className="font-display text-[2.2rem] leading-tight font-medium tracking-[-0.02em] text-ink">
        Join {invite.organization.name}
      </h1>
      <p className="mt-2 mb-8 text-[15px] text-ink-2">
        You&apos;re joining as {roleNames[invite.role]} with <span className="font-medium text-ink">{invite.email}</span>.
      </p>
      <AcceptForm token={token} askLevel={invite.role === "PARAMEDIC"} />
    </>
  );
}
