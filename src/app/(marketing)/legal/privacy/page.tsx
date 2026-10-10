import type { Metadata } from "next";

import { site } from "@/lib/site";

import { LegalPage } from "../legal-page";

export const metadata: Metadata = { title: "Privacy policy" };

export default function PrivacyPolicyPage() {
  return (
    <LegalPage title="Privacy policy" updated="9 October 2026">
      <p>
        Imedica HealthTech Inc. (&ldquo;Imedica&rdquo;) provides decision-training software to paramedic services and
        other healthcare organizations in Canada. This policy explains what personal information we hold, why, and
        the choices you have, in line with PIPEDA and, where it applies, Ontario&apos;s PHIPA.
      </p>
      <h2>What we collect</h2>
      <ul>
        <li>Account details: your name, work email, role, organization, and optionally your paramedic level and years of experience.</li>
        <li>Training activity: the scenarios you run and the decisions you make in them, stored under a pseudonymous key rather than your name.</li>
        <li>Technical records: sign-in times and an audit log of administrative actions.</li>
        <li>Demo requests: the contact details you send us through the website.</li>
      </ul>
      <p>We don&apos;t collect patient information. Scenarios are fictional.</p>
      <h2>How training data is separated</h2>
      <p>
        Your identity and your training activity are held in separate database schemas linked only by a keyed one-way
        hash. Your organization sees aggregated results for groups of at least five people, never your individual
        scores.
      </p>
      <h2>AI-generated explanations</h2>
      <p>
        After a scenario, the scenario content and your decisions, without your name or any identifier, are sent to
        Anthropic to generate a written explanation. The explanation never changes your score.
      </p>
      <h2>Your choices</h2>
      <p>
        You can ask to see, correct or delete your personal information by writing to {site.privacyEmail}. If you
        leave your organization, your account can be deactivated and your identity removed; de-identified training
        records may be kept for aggregate reporting.
      </p>
    </LegalPage>
  );
}
