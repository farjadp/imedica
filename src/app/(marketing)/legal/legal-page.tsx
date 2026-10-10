import type { ReactNode } from "react";

import { PageHero } from "@/components/marketing/page-hero";
import { Container } from "@/components/marketing/section";

export const prose =
  "space-y-6 text-[17px] leading-relaxed text-ink-2 [&_a]:text-pine [&_a]:underline [&_a]:decoration-pine/30 [&_a]:underline-offset-4 [&_h2]:mt-14 [&_h2]:font-display [&_h2]:text-[1.9rem] [&_h2]:leading-tight [&_h2]:font-medium [&_h2]:tracking-[-0.02em] [&_h2]:text-ink [&_strong]:text-ink [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5";

/** Long-form policy and reference pages: a short dark masthead, then a readable column. */
export function LegalPage({
  title,
  updated,
  kicker = "Legal",
  lead,
  draft = true,
  children,
}: {
  title: string;
  updated: string;
  kicker?: string;
  lead?: string;
  draft?: boolean;
  children: ReactNode;
}) {
  return (
    <>
      <PageHero chrome={[kicker, `Last updated ${updated}`]} title={title} lead={lead} className="min-h-[56svh]" />
      <section className="py-16 md:py-24">
        <Container>
          <article className="max-w-[68ch]">
            {draft ? (
              <p className="mb-10 rounded-md border border-tag-yellow/40 bg-tag-yellow-wash px-4 py-3 text-[14px] text-tag-yellow">
                Draft pending legal review. This page describes how the platform is built today; the binding version will
                be published before general availability.
              </p>
            ) : null}
            <div className={prose}>{children}</div>
          </article>
        </Container>
      </section>
    </>
  );
}
