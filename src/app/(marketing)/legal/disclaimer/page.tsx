import type { Metadata } from "next";

import { site } from "@/lib/site";

import { LegalPage } from "../legal-page";

export const metadata: Metadata = {
  title: "Medical disclaimer",
  description: "Imedica is an educational tool for trained clinicians. It is not a medical device and does not replace medical directives or clinical judgement.",
  alternates: { canonical: "/legal/disclaimer" },
};

export default function DisclaimerPage() {
  return (
    <LegalPage
      title="Medical disclaimer"
      updated="10 October 2026"
      lead="Imedica trains decisions. It doesn't make them for anyone, and it never outranks your medical directives."
    >
      <h2>Education, not clinical advice</h2>
      <p>
        Imedica, including its scenarios, scores, debriefs, the Field Notes blog and the mobile apps, is an educational
        tool for trained health professionals and students under supervision. It is <strong>not a medical device</strong>,
        it does not diagnose or treat anyone, and nothing in it is medical advice for a particular patient.
      </p>
      <h2>Your directives come first</h2>
      <p>
        Drugs, doses, thresholds and procedures differ between provinces, services and base hospitals, and they change. In
        practice, always follow your service&apos;s medical directives, base hospital orders, provincial standards and your
        own clinical judgement. Where Imedica differs from them, they are right.
      </p>
      <h2>Simulated patients</h2>
      <p>
        Scenarios are simplified simulations. Real patients present differently, deteriorate on their own timelines and
        respond to treatment in ways a scenario can&apos;t capture. A good score in Imedica is evidence of practice, not of
        competence or certification, unless your service has formally recognized it as such.
      </p>
      <h2>AI-written explanations</h2>
      <p>
        Debrief explanations are written by an AI model from the physician-written rules and your decisions. The model
        can&apos;t change a score, and physicians review explanations, but AI text can still be wrong. If an explanation
        conflicts with the rule or with your directives, trust the rule and the directives, and tell us.
      </p>
      <h2>Field Notes articles</h2>
      <p>
        Blog articles are general education and cite their sources. Each is reviewed by a physician; an article still
        awaiting that review says so at the end. None of them is a substitute for formal training or for local protocols.
      </p>
      <h2>In an emergency</h2>
      <p>Imedica is not a way to get help. In an emergency, call 911.</p>
      <h2>Questions</h2>
      <p>
        If you think something in Imedica is clinically wrong, email <a href={`mailto:${site.contactEmail}`}>{site.contactEmail}</a>{" "}
        and a physician on our team will look at it.
      </p>
    </LegalPage>
  );
}
