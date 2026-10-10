import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { EcgTrace } from "@/components/clinical/ecg-trace";

import { Container } from "./section";

/** The oversized pine call to action that closes every marketing page. */
export function PilotClose({
  title = (
    <>
      Run a pilot with <em className="font-normal text-[#9ff0c4]">your service.</em>
    </>
  ),
  body = "Six months, your paramedics, scenarios matched to your directives, and a before-and-after view of where the team improved. Pilots open in Ontario for 2026.",
  cta = "Book a demo",
  href = "/demo",
}: {
  title?: ReactNode;
  body?: ReactNode;
  cta?: string;
  href?: string;
}) {
  return (
    <section data-nav="dark" className="relative overflow-hidden bg-pine text-paper">
      <div className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 opacity-30" aria-hidden>
        <EcgTrace rhythm="sinus" height={180} stroke="rgb(247 246 241 / 0.5)" />
      </div>
      <Container className="relative py-28 md:py-40">
        <h2 className="max-w-4xl font-display text-[clamp(3rem,7.4vw,7rem)] leading-[0.92] font-medium tracking-[-0.045em]">
          {title}
        </h2>
        <div className="mt-10 flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <p className="max-w-lg text-[18px] leading-relaxed text-paper/75">{body}</p>
          <Link
            href={href}
            className="group inline-flex h-16 items-center gap-3 self-start rounded-full bg-paper pr-3 pl-8 text-[17px] font-medium text-pine transition-colors hover:bg-white md:self-auto"
          >
            {cta}
            <span className="flex size-11 items-center justify-center rounded-full bg-pine text-paper transition-transform group-hover:rotate-45">
              <ArrowUpRight className="size-5" />
            </span>
          </Link>
        </div>
      </Container>
    </section>
  );
}
