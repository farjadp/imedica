"use client";

import { ArrowUpRight, Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { LogoMark } from "@/components/brand/logo";
import { cn } from "@/lib/cn";

const links = [
  { href: "/how-it-works", label: "How it works" },
  { href: "/for-services", label: "For services" },
  { href: "/security", label: "Privacy" },
  { href: "/about", label: "About" },
];

/**
 * A floating pill. Over a dark section (anything marked data-nav="dark")
 * it turns dark itself, so it never sits as a pale slab on the monitor.
 */
export function SiteHeader() {
  const pathname = usePathname();
  const [openOn, setOpenOn] = useState<string | null>(null);
  const [dark, setDark] = useState(false);
  const open = openOn === pathname;

  useEffect(() => {
    const check = () => {
      const probe = 40;
      const dark = [...document.querySelectorAll<HTMLElement>("[data-nav=dark]")].some((el) => {
        const r = el.getBoundingClientRect();
        return r.top <= probe && r.bottom >= probe;
      });
      setDark(dark);
    };
    check();
    window.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check);
    return () => {
      window.removeEventListener("scroll", check);
      window.removeEventListener("resize", check);
    };
  }, [pathname]);

  return (
    <header className="pointer-events-none fixed inset-x-0 top-3 z-50 px-3 md:top-5">
      <div
        className={cn(
          "pointer-events-auto mx-auto flex h-14 max-w-[1080px] items-center justify-between rounded-full border pr-2 pl-4 transition-[background-color,border-color,color,box-shadow] duration-300",
          dark
            ? "border-white/10 bg-[#0b1a16]/85 text-paper shadow-[0_8px_32px_-12px_rgb(0_0_0/0.6)]"
            : "border-rule bg-card/95 text-ink shadow-[0_10px_30px_-18px_rgb(16_32_28/0.45)]",
        )}
      >
        <Link href="/" aria-label="Imedica home" className="flex items-center gap-2 rounded-full">
          <LogoMark className="size-7" />
          <span className="font-display text-[20px] leading-none font-semibold tracking-[-0.02em]">imedica</span>
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-0.5 md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              aria-current={pathname === l.href ? "page" : undefined}
              className={cn(
                "rounded-full px-3.5 py-2 text-[14px] transition-colors",
                dark ? "text-paper/70 hover:bg-white/8 hover:text-paper" : "text-ink-2 hover:bg-paper-2 hover:text-ink",
                pathname === l.href && (dark ? "bg-white/10 text-paper" : "bg-paper-2 text-ink"),
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-1 md:flex">
          <Link
            href="/login"
            className={cn("rounded-full px-3.5 py-2 text-[14px]", dark ? "text-paper/75 hover:text-paper" : "text-ink-2 hover:text-ink")}
          >
            Sign in
          </Link>
          <Link
            href="/demo"
            className={cn(
              "group inline-flex h-10 items-center gap-1.5 rounded-full px-4 text-[14px] font-medium transition-colors",
              dark ? "bg-[#9ff0c4] text-[#06110e] hover:bg-white" : "bg-pine text-paper hover:bg-pine-2",
            )}
          >
            Book a demo
            <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </div>

        <button
          type="button"
          className="inline-flex size-10 items-center justify-center rounded-full md:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpenOn(open ? null : pathname)}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {open ? (
        <nav
          id="mobile-nav"
          aria-label="Main"
          className="pointer-events-auto mx-auto mt-2 max-w-[1080px] rounded-3xl border border-rule bg-card p-3 shadow-[var(--shadow-float)] md:hidden"
        >
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="block rounded-2xl px-4 py-3.5 text-[16px] text-ink hover:bg-paper">
              {l.label}
            </Link>
          ))}
          <div className="mt-2 grid grid-cols-2 gap-2">
            <Link href="/login" className="rounded-full border border-rule py-3 text-center text-[15px] text-ink">
              Sign in
            </Link>
            <Link href="/demo" className="rounded-full bg-pine py-3 text-center text-[15px] font-medium text-paper">
              Book a demo
            </Link>
          </div>
        </nav>
      ) : null}
    </header>
  );
}
