"use client";

import { LogOut, Menu, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";

import { Logo } from "@/components/brand/logo";
import { cn } from "@/lib/cn";
import { logout } from "@/server/auth/actions";

export type NavItem = { href: string; label: string; icon: LucideIcon; exact?: boolean };

export function AppShell({
  nav,
  user,
  context,
  children,
}: {
  nav: NavItem[];
  user: { name: string; detail: string };
  context: string;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = openOn === pathname;

  const isActive = (item: NavItem) => (item.exact ? pathname === item.href : pathname.startsWith(item.href));

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center justify-between px-5">
        <Link href="/" aria-label="Imedica home" className="rounded-md">
          <Logo />
        </Link>
      </div>
      <p className="px-5 pb-2 font-mono text-[10px] tracking-wider text-ink-3 uppercase">{context}</p>
      <nav aria-label="Sections" className="flex-1 space-y-0.5 px-3">
        {nav.map((item) => {
          const active = isActive(item);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex h-9 items-center gap-2.5 rounded-md px-2.5 text-[14px] transition-colors",
                active ? "bg-pine text-paper" : "text-ink-2 hover:bg-paper-2 hover:text-ink",
              )}
            >
              <item.icon className="size-4 shrink-0" aria-hidden />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-rule p-3">
        <div className="px-2 py-2">
          <p className="truncate text-[14px] font-medium text-ink">{user.name}</p>
          <p className="truncate text-[12px] text-ink-3">{user.detail}</p>
        </div>
        <form action={logout}>
          <button
            type="submit"
            className="flex h-9 w-full items-center gap-2.5 rounded-md px-2.5 text-[14px] text-ink-2 hover:bg-paper-2 hover:text-ink"
          >
            <LogOut className="size-4" aria-hidden /> Sign out
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-dvh">
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 border-r border-rule bg-paper lg:block">{sidebar}</aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-rule bg-paper px-4 lg:hidden">
          <Logo />
          <button
            type="button"
            className="inline-flex size-10 items-center justify-center rounded-md"
            aria-expanded={open}
            aria-label={open ? "Close navigation" : "Open navigation"}
            onClick={() => setOpenOn(open ? null : pathname)}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </header>
        {open ? (
          <div className="fixed inset-0 top-14 z-20 bg-paper lg:hidden">{sidebar}</div>
        ) : null}
        <main id="main" className="flex-1 px-4 py-6 md:px-8 md:py-8">
          <div className="mx-auto max-w-[1180px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
