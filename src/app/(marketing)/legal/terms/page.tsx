import type { Metadata } from "next";

import { site } from "@/lib/site";

import { LegalPage } from "../legal-page";

export const metadata: Metadata = { title: "Terms of use" };

export default function TermsPage() {
  return (
    <LegalPage title="Terms of use" updated="9 October 2026">
      <h2>A training tool</h2>
      <p>
        Imedica is an educational tool. It is not a medical device, it does not provide clinical advice, and it does
        not replace the medical directives, base hospital orders or protocols of your service. Always follow those in
        practice.
      </p>
      <h2>Accounts</h2>
      <p>
        Accounts are issued by your organization. Keep your password private and tell your training lead if you think
        your account has been used by someone else.
      </p>
      <h2>Content</h2>
      <p>
        Scenarios, rules and feedback are written by clinicians and are the property of Imedica or the organization
        that commissioned them. Please don&apos;t copy or redistribute them outside your service.
      </p>
      <h2>Contact</h2>
      <p>Questions about these terms: {site.contactEmail}.</p>
    </LegalPage>
  );
}
