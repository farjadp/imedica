import type { Metadata } from "next";
import Link from "next/link";

import { site } from "@/lib/site";

import { LegalPage } from "../legal/legal-page";

export const metadata: Metadata = {
  title: "PIPEDA & PHIPA",
  description: "How Imedica is built to meet PIPEDA and Ontario's PHIPA: the ten fair information principles, mapped to how the platform actually works.",
  alternates: { canonical: "/pipeda" },
};

const principles = [
  ["Accountability", "Imedica HealthTech Inc. is responsible for the personal information it holds. Questions go to our privacy contact below, and every administrative action is written to an audit log."],
  ["Identifying purposes", "We collect what's needed to run training: your name, email, role and organization to sign you in and manage seats, and your decisions in scenarios to score and explain them. Nothing else."],
  ["Consent", "Your organization invites you; you create your own account and accept the terms. Training data is used for your training and your service's de-identified reporting, never sold or used for advertising."],
  ["Limiting collection", "No health information about patients is collected: scenarios are fictional. We don't collect location, contacts or device identifiers beyond what sign-in needs."],
  ["Limiting use, disclosure and retention", "Training data stays with the service that owns it. AI explanations are generated without your name, email or organization. Records are kept while your service's agreement is active and deleted or returned when it ends."],
  ["Accuracy", "You can correct your profile at any time. Your training lead can update roles and deactivate accounts when people leave."],
  ["Safeguards", "Identity, content and analytics are separate Postgres schemas with no relations between them; a keyed one-way hash (HMAC-SHA256) is the only link. Passwords are hashed with bcrypt, sessions are server-side and revocable."],
  ["Openness", "This page, our privacy policy and the security page describe how the platform works in plain language."],
  ["Individual access", "You can ask for a copy of the personal information we hold about you, and we'll answer in writing within 30 days."],
  ["Challenging compliance", "If you're not satisfied with our answer, you can complain to the Office of the Privacy Commissioner of Canada or, in Ontario, the Information and Privacy Commissioner."],
];

export default function PipedaPage() {
  return (
    <LegalPage
      title="PIPEDA & PHIPA"
      kicker="Compliance · Canada"
      updated="10 October 2026"
      lead="Canada's private-sector privacy law has ten principles. Here is each one, and what Imedica actually does about it."
    >
      <h2>What applies to us</h2>
      <p>
        PIPEDA, the federal Personal Information Protection and Electronic Documents Act, governs how private companies in
        Canada handle personal information. Ontario&apos;s Personal Health Information Protection Act (PHIPA) applies to
        health information custodians and the agents and providers who work with them. Imedica holds staff training data,
        not patient records, but we design to PHIPA&apos;s stricter standard because the services we work with are bound by
        it.
      </p>
      <h2>The ten principles, in practice</h2>
      <ol className="space-y-6">
        {principles.map(([title, body], i) => (
          <li key={title} className="grid gap-1 border-t border-rule pt-5 sm:grid-cols-[48px_1fr]">
            <span className="font-mono text-[13px] text-signal">{String(i + 1).padStart(2, "0")}</span>
            <div>
              <p className="font-medium text-ink">{title}</p>
              <p className="mt-1">{body}</p>
            </div>
          </li>
        ))}
      </ol>
      <h2>Reporting without singling anyone out</h2>
      <p>
        Training leads see their own organization only, and only figures built from five or more people. The check runs
        inside the reporting query, so a small group can&apos;t be filtered into view.
      </p>
      <h2>Where the data lives</h2>
      <p>
        The platform is designed to run entirely in Canadian data centres. We confirm the exact hosting arrangement in
        writing during procurement, and we&apos;ll tell customers before it changes.
      </p>
      <h2>Contact</h2>
      <p>
        Privacy questions, access requests and procurement questionnaires: <a href={`mailto:${site.privacyEmail}`}>{site.privacyEmail}</a>.
        For the technical detail, see <Link href="/security">Privacy &amp; security</Link> and the{" "}
        <Link href="/legal/privacy">privacy policy</Link>.
      </p>
    </LegalPage>
  );
}
