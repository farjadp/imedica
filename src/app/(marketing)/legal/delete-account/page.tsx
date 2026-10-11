import type { Metadata } from "next";

import { site } from "@/lib/site";

import { LegalPage } from "../legal-page";

export const metadata: Metadata = {
  title: "Delete your account",
  description: "How to delete your Imedica account from the app, what is deleted, and what is kept.",
  alternates: { canonical: "/legal/delete-account" },
};

// Public on purpose: Google Play and the App Store link here, and a reviewer
// reads it signed out.
export default function DeleteAccountPage() {
  return (
    <LegalPage title="Delete your account" updated="11 October 2026" kicker="Your data">
      <h2>In the Imedica app</h2>
      <ol className="list-decimal space-y-2 pl-5">
        <li>Open the <strong>You</strong> tab.</li>
        <li>Scroll to <strong>Account</strong> and tap <strong>Delete account</strong>.</li>
        <li>Enter your password and tap <strong>Delete my account</strong>, then confirm.</li>
      </ol>
      <p>Deletion happens straight away and signs you out on every device.</p>
      <p>
        Accounts for physicians, training leads and Imedica staff are closed by our team, because they own clinical
        content. Write to <a href={`mailto:${site.privacyEmail}`}>{site.privacyEmail}</a> from your work email.
      </p>

      <h2>Without the app</h2>
      <p>
        Write to <a href={`mailto:${site.privacyEmail}?subject=Delete%20my%20Imedica%20account`}>{site.privacyEmail}</a>{" "}
        from the email address on your account. We confirm it&apos;s you and delete the account within 30 days.
      </p>

      <h2>What is deleted</h2>
      <ul>
        <li>Your name, email, password and sign-in sessions.</li>
        <li>Your profile: preferred name, pronouns, level, years of experience, station, bio, certifications and photo.</li>
        <li>Your reading list of saved research papers.</li>
        <li>The phones registered to get notifications for you.</li>
      </ul>

      <h2>What is kept</h2>
      <p>
        Your past scenario runs and pre/post test answers were always stored under a pseudonymous key, not your name.
        Once your account is deleted, that key can no longer be connected to you. These de-identified records stay in
        your service&apos;s team results, which only ever show groups of five or more people.
      </p>
      <p>
        Our audit log keeps a record that an account was deleted, with its internal ID and your service, but not your
        name or email.
      </p>
    </LegalPage>
  );
}
