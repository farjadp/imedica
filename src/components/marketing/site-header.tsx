"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { Logo } from "@/components/brand/logo";
import { ButtonLink } from "@/components/ui/button";
import { cn } from "@/lib/cn";

const links = [
  { href: "/how-it-works", label: "How it works" },
  { href: "/for-services", label: "For services" },
  { href: "/security", label: "Privacy & security" },
  { href: "/about", label: "About" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  // The menu remembers which page it was opened on, so navigating closes it.
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = openOn === pathname;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b bg-paper/95 transition-colors duration-200",
        scrolled || open ? "border-rule" : "border-transparent",
      )}
    >
      <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-5 md:px-8">
        <Link href="/" aria-label="Imedica home" className="rounded-md">
          <Logo />
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              aria-current={pathname === l.href ? "page" : undefined}
              className={cn(
                "rounded-md px-3 py-2 text-[14px] text-ink-2 transition-colors hover:text-ink",
                pathname === l.href && "text-ink underline decoration-signal decoration-2 underline-offset-[10px]",
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <ButtonLink href="/login" variant="ghost" size="sm">
            Sign in
          </ButtonLink>
          <ButtonLink href="/demo" size="sm">
            Request a demo
          </ButtonLink>
        </div>

        <button
          type="button"
          className="-mr-2 inline-flex size-10 items-center justify-center rounded-md text-ink md:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpenOn(open ? null : pathname)}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {open ? (
        <nav id="mobile-nav" aria-label="Main" className="border-t border-rule px-5 pt-2 pb-5 md:hidden">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="block border-b border-rule-2 py-3.5 text-[15px] text-ink">
              {l.label}
            </Link>
          ))}
          <div className="mt-4 grid grid-cols-2 gap-2">
            <ButtonLink href="/login" variant="secondary">
              Sign in
            </ButtonLink>
            <ButtonLink href="/demo">Request a demo</ButtonLink>
          </div>
        </nav>
      ) : null}
    </header>
  );
}
