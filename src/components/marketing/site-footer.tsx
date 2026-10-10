import Link from "next/link";

import { Logo } from "@/components/brand/logo";

const columns = [
  {
    title: "Product",
    links: [
      { href: "/how-it-works", label: "How it works" },
      { href: "/for-services", label: "For services" },
      { href: "/security", label: "Privacy & security" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About" },
      { href: "/demo", label: "Request a demo" },
      { href: "/login", label: "Sign in" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/legal/privacy", label: "Privacy policy" },
      { href: "/legal/terms", label: "Terms of use" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-rule bg-paper">
      <div className="mx-auto grid max-w-[1200px] gap-12 px-5 py-14 md:grid-cols-[1.4fr_repeat(3,1fr)] md:px-8">
        <div className="max-w-xs">
          <Logo />
          <p className="mt-4 text-sm leading-relaxed text-ink-3">
            Decision training for Canadian paramedics. Built by physicians in Toronto, Ontario.
          </p>
        </div>
        {columns.map((c) => (
          <div key={c.title}>
            <h2 className="text-[13px] font-medium text-ink">{c.title}</h2>
            <ul className="mt-3 space-y-2.5">
              {c.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-ink-3 hover:text-ink">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-rule-2">
        <div className="mx-auto flex max-w-[1200px] flex-col gap-2 px-5 py-5 text-[13px] text-ink-3 md:flex-row md:justify-between md:px-8">
          <p>© {new Date().getFullYear()} Imedica HealthTech Inc.</p>
          <p>A training tool, not a medical device. It does not replace your medical directives.</p>
        </div>
      </div>
    </footer>
  );
}
