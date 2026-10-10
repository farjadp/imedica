import type { Metadata } from "next";

import { site } from "@/lib/site";
import { Container, SectionHeading } from "@/components/marketing/section";

import { DemoForm } from "./demo-form";

export const metadata: Metadata = {
  title: "Request a demo",
  description: "Book a walkthrough of Imedica with a member of the clinical team.",
};

export default function DemoPage() {
  return (
    <section className="py-16 md:py-24">
      <Container className="grid items-start gap-12 lg:grid-cols-[1fr_minmax(0,560px)] lg:gap-20">
        <div>
          <SectionHeading
            as="h1"
            title="See a scenario run, start to finish."
            lead="Thirty minutes with a physician from our team: a live scenario, the debrief, the instructor view, and how a pilot would work for your service."
          />
          <ul className="mt-10 space-y-4 border-t border-rule pt-8 text-[15px] text-ink-2">
            <li>For paramedic, fire and hospital services, colleges and long-term care.</li>
            <li>Pilots are open to services in Ontario in 2026.</li>
            <li>Prefer email? Write to {site.contactEmail}.</li>
          </ul>
        </div>
        <DemoForm />
      </Container>
    </section>
  );
}
