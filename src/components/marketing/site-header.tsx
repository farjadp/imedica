"use client";

import { ArrowUpRight, ChevronDown, Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { LogoMark } from "@/components/brand/logo";
import { cn } from "@/lib/cn";

import { isActive, mainNav } from "./nav";

/**
 * A floating pill. Over a dark section (anything marked data-nav="dark")
 * it turns dark itself, so it never sits as a pale slab on the monitor.
 */
export function SiteHeader() {
  const pathname = usePathname();
  const [openOn, setOpenOn] = useState<string | null>(null);
  const [dark, setDark] = useState(false);
  const [menu, setMenu] = useState<{ label: string; on: string } | null>(null);
  const [section, setSection] = useState<string | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const navRef = useRef<HTMLElement>(null);
  const open = openOn === pathname;
  // A dropdown belongs to the page it was opened on; navigating closes it.
  const openMenu = menu?.on === pathname ? menu.label : null;

  useEffect(() => {
    if (!openMenu) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenu(null);
    const onClick = (e: MouseEvent) => {
      if (!navRef.current?.contains(e.target as Node)) setMenu(null);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onClick);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onClick);
    };
  }, [openMenu]);

  const hoverOpen = (label: string) => {
    clearTimeout(closeTimer.current);
    setMenu({ label, on: pathname });
  };
  const hoverClose = () => {
    closeTimer.current = setTimeout(() => setMenu(null), 140);
  };

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
          <LogoMark className={cn("size-7", dark && "text-[#9ff0c4]")} />
          <span className="font-display text-[20px] leading-none font-semibold tracking-[-0.02em]">
            i<span className={dark ? "text-[#9ff0c4]" : "text-brand"}>M</span>edica
          </span>
        </Link>

        <nav ref={navRef} aria-label="Main" className="hidden items-center gap-0.5 lg:flex">
          {mainNav.map((g) => {
            const here = g.href ? isActive(pathname, g.href) : g.items!.some((i) => isActive(pathname, i.href));
            const item = cn(
              "inline-flex items-center gap-1 rounded-full px-3.5 py-2 text-[14px] transition-colors",
              dark ? "text-paper/70 hover:bg-white/8 hover:text-paper" : "text-ink-2 hover:bg-paper-2 hover:text-ink",
              (here || openMenu === g.label) && (dark ? "bg-white/10 text-paper" : "bg-paper-2 text-ink"),
            );
            if (g.href) {
              return (
                <Link key={g.label} href={g.href} aria-current={here ? "page" : undefined} className={item}>
                  {g.label}
                </Link>
              );
            }
            const id = `menu-${g.label.toLowerCase().replace(/\W+/g, "-")}`;
            return (
              <div key={g.label} className="relative" onMouseEnter={() => hoverOpen(g.label)} onMouseLeave={hoverClose}>
                <button
                  type="button"
                  className={item}
                  aria-expanded={openMenu === g.label}
                  aria-controls={id}
                  onClick={() => setMenu(openMenu === g.label ? null : { label: g.label, on: pathname })}
                >
                  {g.label}
                  <ChevronDown className={cn("size-3.5 opacity-60 transition-transform", openMenu === g.label && "rotate-180")} />
                </button>
                {openMenu === g.label ? (
                  <div id={id} className="absolute top-full left-1/2 z-10 w-[340px] -translate-x-1/2 pt-3">
                    <ul
                      className={cn(
                        "rounded-2xl border p-2 shadow-[0_24px_60px_-24px_rgb(0_0_0/0.45)]",
                        dark ? "border-white/10 bg-[#0b1a16]" : "border-rule bg-card",
                      )}
                    >
                      {g.items!.map((i) => (
                        <li key={i.href}>
                          <Link
                            href={i.href}
                            onClick={() => setMenu(null)}
                            aria-current={isActive(pathname, i.href) ? "page" : undefined}
                            className={cn("block rounded-xl px-4 py-3 transition-colors", dark ? "hover:bg-white/6" : "hover:bg-paper")}
                          >
                            <span className={cn("block text-[14px] font-medium", dark ? "text-paper" : "text-ink")}>{i.label}</span>
                            {i.blurb ? <span className={cn("mt-0.5 block text-[13px]", dark ? "text-paper/55" : "text-ink-3")}>{i.blurb}</span> : null}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            );
          })}
        </nav>

        <div className="hidden items-center gap-1 lg:flex">
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
          className="inline-flex size-10 items-center justify-center rounded-full lg:hidden"
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
          className="pointer-events-auto mx-auto mt-2 max-h-[calc(100dvh-6rem)] max-w-[1080px] overflow-y-auto rounded-3xl border border-rule bg-card p-3 shadow-[var(--shadow-float)] lg:hidden"
        >
          {mainNav.map((g) =>
            g.href ? (
              <Link key={g.label} href={g.href} className="block rounded-2xl px-4 py-3.5 text-[16px] text-ink hover:bg-paper">
                {g.label}
              </Link>
            ) : (
              <div key={g.label}>
                <button
                  type="button"
                  aria-expanded={section === g.label}
                  onClick={() => setSection(section === g.label ? null : g.label)}
                  className="flex w-full items-center justify-between rounded-2xl px-4 py-3.5 text-left text-[16px] text-ink hover:bg-paper"
                >
                  {g.label}
                  <ChevronDown className={cn("size-4 text-ink-3 transition-transform", section === g.label && "rotate-180")} />
                </button>
                {section === g.label ? (
                  <ul className="mb-2 ml-4 border-l border-rule pl-2">
                    {g.items!.map((i) => (
                      <li key={i.href}>
                        <Link href={i.href} className="block rounded-xl px-3 py-2.5 text-[15px] text-ink-2 hover:bg-paper hover:text-ink">
                          {i.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ),
          )}
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
