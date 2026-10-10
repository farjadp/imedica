import Link from "next/link";

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
      { href: "/demo", label: "Book a demo" },
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
    <footer className="mt-auto overflow-hidden bg-[#06110e] text-paper">
      <div className="mx-auto grid max-w-[1320px] gap-12 px-5 pt-20 pb-10 md:grid-cols-[1.5fr_repeat(3,1fr)] md:px-10">
        <div className="max-w-sm">
          <p className="font-display text-[1.6rem] leading-snug font-medium">
            Decision training for Canadian paramedics.
          </p>
          <p className="mt-4 text-[14px] leading-relaxed text-paper/55">
            Built by clinicians in Toronto, Ontario. A training tool, not a medical device. It never replaces your
            medical directives.
          </p>
        </div>
        {columns.map((c) => (
          <div key={c.title}>
            <h2 className="font-mono text-[11px] tracking-[0.14em] text-paper/45 uppercase">{c.title}</h2>
            <ul className="mt-4 space-y-3">
              {c.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-[15px] text-paper/80 transition-colors hover:text-[#9ff0c4]">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* The wordmark, set as big as the page allows. */}
      <div className="relative mx-auto max-w-[1320px] px-3 md:px-6" aria-hidden>
        <p className="font-display leading-[0.78] font-semibold tracking-[-0.055em] text-transparent select-none [-webkit-text-stroke:1px_rgb(159_240_196/0.28)] text-[27vw] xl:text-[23.5rem]">
          imedica
        </p>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-[1320px] flex-col gap-2 px-5 py-6 text-[13px] text-paper/45 md:flex-row md:justify-between md:px-10">
          <p>© {new Date().getFullYear()} Imedica HealthTech Inc.</p>
          <p>Toronto · Ontario · Canada</p>
        </div>
      </div>
    </footer>
  );
}
