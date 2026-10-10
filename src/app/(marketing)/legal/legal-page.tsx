import type { ReactNode } from "react";

import { Container } from "@/components/marketing/section";

export function LegalPage({ title, updated, children }: { title: string; updated: string; children: ReactNode }) {
  return (
    <section className="py-16 md:py-24">
      <Container>
        <article className="max-w-[68ch]">
          <h1 className="font-display text-[clamp(2.2rem,4vw,3rem)] font-medium tracking-[-0.02em] text-ink">{title}</h1>
          <p className="mt-3 text-[14px] text-ink-3">Last updated {updated}</p>
          <p className="mt-6 rounded-md border border-tag-yellow/40 bg-tag-yellow-wash px-4 py-3 text-[14px] text-tag-yellow">
            Draft pending legal review. This page describes how the platform is built today; the binding version will
            be published before general availability.
          </p>
          <div className="mt-10 space-y-6 text-[16px] leading-relaxed text-ink-2 [&_h2]:mt-12 [&_h2]:font-display [&_h2]:text-2xl [&_h2]:font-medium [&_h2]:text-ink [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5">
            {children}
          </div>
        </article>
      </Container>
    </section>
  );
}
