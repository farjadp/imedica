// The site map, shared by the header (five top items with dropdowns) and the
// footer (every page). Add a page here and it appears in both.

export type NavLink = { href: string; label: string; blurb?: string };
export type NavGroup = { label: string; href?: string; items?: NavLink[] };

export const mainNav: NavGroup[] = [
  {
    label: "Product",
    items: [
      { href: "/product", label: "The product", blurb: "What Imedica is and what's inside" },
      { href: "/how-it-works", label: "How it works", blurb: "From a physician's rules to a debrief" },
      { href: "/download", label: "Mobile app", blurb: "iPhone and Android, launching Oct 20" },
      { href: "/roadmap", label: "Roadmap", blurb: "What's shipped, what's next" },
    ],
  },
  {
    label: "Who it's for",
    items: [
      { href: "/audiences", label: "Who we serve", blurb: "Services, colleges, hospitals, long-term care" },
      { href: "/for-services", label: "For training leads", blurb: "Team readiness without ranking people" },
      { href: "/security", label: "Privacy & security", blurb: "How the data model protects your people" },
    ],
  },
  { label: "Pricing", href: "/pricing" },
  {
    label: "Resources",
    items: [
      { href: "/blog", label: "Field Notes", blurb: "Case breakdowns and protocol notes" },
      { href: "/pipeda", label: "PIPEDA & PHIPA", blurb: "Our compliance position, plainly" },
      { href: "/why-us", label: "Why Imedica", blurb: "How we differ from mannequins and VR" },
    ],
  },
  {
    label: "Company",
    items: [
      { href: "/about", label: "About us", blurb: "Clinicians building the training we wanted" },
      { href: "/commitment", label: "Our commitment", blurb: "The promises behind the brand" },
      { href: "/careers", label: "Careers", blurb: "Engineers, physicians, AI, nurses" },
      { href: "/contact", label: "Contact", blurb: "Newmarket, Ontario" },
    ],
  },
];

export const legalNav: NavLink[] = [
  { href: "/legal/privacy", label: "Privacy policy" },
  { href: "/legal/terms", label: "Terms of use" },
  { href: "/legal/disclaimer", label: "Medical disclaimer" },
  { href: "/pipeda", label: "PIPEDA & PHIPA" },
  { href: "/brand", label: "Brand sheet" },
];

export function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}
