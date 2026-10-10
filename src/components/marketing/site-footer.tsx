import { Mail, MapPin, Phone } from "lucide-react";
import Link from "next/link";

import { LogoMark } from "@/components/brand/logo";
import { site } from "@/lib/site";

import { legalNav, mainNav } from "./nav";

const columns = [
  ...mainNav.filter((g) => g.items).map((g) => ({ title: g.label, links: g.items! })),
  { title: "Legal & brand", links: legalNav },
];

const link = "text-[14px] text-paper/75 transition-colors hover:text-[#9ff0c4]";

export function SiteFooter() {
  const a = site.address;
  return (
    <footer className="mt-auto overflow-hidden bg-[#06110e] text-paper">
      <div className="mx-auto grid max-w-[1320px] gap-12 px-5 pt-20 pb-10 md:px-10 lg:grid-cols-[1.3fr_2.7fr]">
        <div className="max-w-sm">
          <LogoMark className="size-10 text-[#9ff0c4]" />
          <p className="mt-6 font-display text-[1.6rem] leading-snug font-medium">Decision training for Canadian paramedics.</p>
          <p className="mt-4 text-[14px] leading-relaxed text-paper/55">
            Built by clinicians in Ontario. A training tool, not a medical device. It never replaces your medical directives.
          </p>
          <address className="mt-8 space-y-2.5 text-[14px] text-paper/70 not-italic">
            <p className="flex gap-2.5">
              <MapPin className="mt-0.5 size-4 shrink-0 text-paper/40" aria-hidden />
              {a.street}, {a.city}, {a.province} {a.postalCode}
            </p>
            <p className="flex gap-2.5">
              <Phone className="mt-0.5 size-4 shrink-0 text-paper/40" aria-hidden />
              <a href={site.phoneHref} className="hover:text-[#9ff0c4]">
                {site.phone}
              </a>
            </p>
            <p className="flex gap-2.5">
              <Mail className="mt-0.5 size-4 shrink-0 text-paper/40" aria-hidden />
              <a href={`mailto:${site.contactEmail}`} className="hover:text-[#9ff0c4]">
                {site.contactEmail}
              </a>
            </p>
          </address>
        </div>
        <div className="grid grid-cols-2 gap-10 sm:grid-cols-3 xl:grid-cols-6">
          {columns.map((c) => (
            <nav key={c.title} aria-label={c.title}>
              <h2 className="font-mono text-[11px] tracking-[0.14em] text-paper/45 uppercase">{c.title}</h2>
              <ul className="mt-4 space-y-3">
                {c.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className={link}>
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
          <nav aria-label="Get started">
            <h2 className="font-mono text-[11px] tracking-[0.14em] text-paper/45 uppercase">Get started</h2>
            <ul className="mt-4 space-y-3">
              <li>
                <Link href="/pricing" className={link}>
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/demo" className={link}>
                  Book a demo
                </Link>
              </li>
              <li>
                <Link href="/login" className={link}>
                  Sign in
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      {/* The wordmark, set as big as the page allows. */}
      <div className="relative mx-auto max-w-[1320px] px-3 md:px-6" aria-hidden>
        <p className="font-display text-[27vw] leading-[0.78] font-semibold tracking-[-0.055em] text-transparent select-none [-webkit-text-stroke:1px_rgb(159_240_196/0.28)] xl:text-[23.5rem]">
          imedica
        </p>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-[1320px] flex-col gap-2 px-5 py-6 text-[13px] text-paper/45 md:flex-row md:justify-between md:px-10">
          <p>
            © {new Date().getFullYear()} {site.legalName}
          </p>
          <p>Newmarket · Ontario · Canada</p>
        </div>
      </div>
    </footer>
  );
}
