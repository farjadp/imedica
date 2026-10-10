import { ArrowRight, Mail, MapPin, Phone } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { ContactForm } from "@/components/marketing/forms";
import { Accent, PageHero } from "@/components/marketing/page-hero";
import { Container } from "@/components/marketing/section";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact",
  description: `Contact Imedica in Newmarket, Ontario: ${site.phone}, ${site.contactEmail}, or send a message to the team.`,
  alternates: { canonical: "/contact" },
};

const a = site.address;
const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${a.street}, ${a.city}, ${a.province} ${a.postalCode}`)}`;

const routes = [
  { href: "/demo", title: "See a scenario run", body: "Thirty minutes with a physician from our team." },
  { href: "/careers", title: "Work with us", body: "Engineers, physicians, AI and nursing." },
  { href: "/security", title: "Privacy questions", body: "How the data model protects your people." },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: site.legalName,
  email: site.contactEmail,
  telephone: site.phone,
  address: {
    "@type": "PostalAddress",
    streetAddress: a.street,
    addressLocality: a.city,
    addressRegion: a.province,
    postalCode: a.postalCode,
    addressCountry: "CA",
  },
};

export default function ContactPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <PageHero
        chrome={["Contact · Newmarket, Ontario", "Replies within two business days"]}
        title={
          <>
            Talk to the people <Accent>who build it.</Accent>
          </>
        }
        lead="Questions about a pilot, the product, privacy or a partnership: write to us and a clinician or engineer from the team will answer."
        aside={<ContactForm />}
      >
        <ul className="mt-12 max-w-xl divide-y divide-white/10 border-y border-white/10">
          {[
            { icon: MapPin, label: "Office", value: `${a.street}, ${a.city}, ${a.province} ${a.postalCode}`, href: mapUrl, external: true },
            { icon: Phone, label: "Phone", value: site.phone, href: site.phoneHref },
            { icon: Mail, label: "Email", value: site.contactEmail, href: `mailto:${site.contactEmail}` },
          ].map(({ icon: Icon, label, value, href, external }) => (
            <li key={label} className="flex items-center gap-5 py-4">
              <span className="w-16 shrink-0 font-mono text-[11px] tracking-[0.14em] text-paper/45 uppercase">{label}</span>
              <a href={href} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})} className="flex min-w-0 items-center gap-2 text-[16px] text-paper/85 hover:text-[#9ff0c4]">
                <Icon className="size-4 shrink-0 text-[#9ff0c4]" aria-hidden />
                <span className="truncate">{value}</span>
              </a>
            </li>
          ))}
        </ul>
      </PageHero>

      <section className="py-20 md:py-28">
        <Container>
          <h2 className="font-display text-[clamp(2rem,4vw,3.4rem)] leading-none font-medium tracking-[-0.035em] text-ink">
            Or go <em className="font-normal text-pine-3">straight there.</em>
          </h2>
          <ul className="mt-12 grid gap-5 md:grid-cols-3">
            {routes.map((r) => (
              <li key={r.href}>
                <Link href={r.href} className="group flex h-full flex-col justify-between rounded-2xl border border-rule bg-card p-7 transition-colors hover:border-ink">
                  <div>
                    <p className="font-display text-[1.6rem] leading-tight text-ink">{r.title}</p>
                    <p className="mt-2 text-[15px] text-ink-3">{r.body}</p>
                  </div>
                  <ArrowRight className="mt-8 size-5 text-pine transition-transform group-hover:translate-x-1" />
                </Link>
              </li>
            ))}
          </ul>
        </Container>
      </section>
    </>
  );
}
