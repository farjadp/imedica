"use client";

import { ClipboardCheck, History, Home, LayoutDashboard, Library, UserRound } from "lucide-react";
import type { ReactNode } from "react";

import { AppShell, type NavItem } from "./app-shell";

const base: NavItem[] = [
  { href: "/app", label: "Today", icon: Home, exact: true },
  { href: "/app/scenarios", label: "Scenario library", icon: Library },
  { href: "/app/history", label: "My runs", icon: History },
  { href: "/app/assessments", label: "Assessments", icon: ClipboardCheck },
  { href: "/app/account", label: "Account", icon: UserRound },
];

export function LearnerNav({ staff, user, children }: { staff: boolean; user: { name: string; detail: string }; children: ReactNode }) {
  const nav = staff ? [...base, { href: "/admin", label: "Admin", icon: LayoutDashboard }] : base;
  return (
    <AppShell nav={nav} user={user} context="Training">
      {children}
    </AppShell>
  );
}
