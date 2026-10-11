import type { Metadata } from "next";

import { site } from "@/lib/site";

import { LegalPage } from "../legal-page";

export const metadata: Metadata = { title: "Privacy policy" };

export default function PrivacyPolicyPage() {
  return (
    <LegalPage title="Privacy policy" updated="11 October 2026">
      <p>
        Imedica HealthTech Inc. (&ldquo;Imedica&rdquo;) provides decision-training software to paramedic services and
        other healthcare organizations in Canada. This policy explains what personal information we hold, why, and
        the choices you have, in line with PIPEDA and, where it applies, Ontario&apos;s PHIPA.
      </p>
      <h2>What we collect</h2>
      <ul>
        <li>Account details: your name, work email, role, organization, and optionally your paramedic level and years of experience.</li>
        <li>Profile details you choose to add: a preferred name, pronouns, your station, a short bio, certifications and a profile photo. Only you see your photo.</li>
        <li>Training activity: the scenarios you run, the decisions you make in them, and your pre/post test answers, stored under a pseudonymous key rather than your name.</li>
        <li>Your reading list: the research papers you save in the app.</li>
        <li>On your phone: a notification token, so we can tell you when your service opens a pre- or post-test. You can turn these notices off in the app.</li>
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
      <p>
        When you ask for a plain-language brief of a research paper, the paper&apos;s text is sent to Anthropic. Nothing
        about you is sent with it.
      </p>
      <h2>The mobile app</h2>
      <p>
        The app talks only to Imedica&apos;s own servers. It has no advertising, analytics or crash-reporting tools, and
        we don&apos;t track you across other apps or websites. If you turn on the Face ID or fingerprint lock, your
        phone checks it; Imedica never receives biometric data.
      </p>
      <h2>Your choices</h2>
      <p>
        You can ask to see, correct or delete your personal information by writing to {site.privacyEmail}. Paramedics
        can delete their own account in the app; <a href="/legal/delete-account">here is how, and what is kept</a>. If
        you leave your organization, your account can be deactivated and your identity removed; de-identified training
        records may be kept for aggregate reporting.
      </p>
    </LegalPage>
  );
}
