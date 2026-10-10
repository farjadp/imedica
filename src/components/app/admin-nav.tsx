"use client";

import { Activity, BookOpen, Building2, ClipboardList, Gauge, Inbox, Mail, Newspaper, Sparkles, Users } from "lucide-react";
import type { ReactNode } from "react";

import type { Role } from "@/generated/prisma/enums";

import { AppShell, type NavItem } from "./app-shell";

const items: (NavItem & { roles: Role[] })[] = [
  { href: "/admin", label: "Overview", icon: Gauge, exact: true, roles: ["INSTRUCTOR", "PHYSICIAN", "ADMIN"] },
  { href: "/admin/scenarios", label: "Scenarios", icon: BookOpen, roles: ["PHYSICIAN", "ADMIN"] },
  { href: "/admin/blog", label: "Blog", icon: Newspaper, roles: ["PHYSICIAN", "ADMIN"] },
  { href: "/admin/ai", label: "AI review", icon: Sparkles, roles: ["PHYSICIAN", "ADMIN"] },
  { href: "/admin/analytics", label: "Team readiness", icon: Activity, roles: ["INSTRUCTOR", "ADMIN"] },
  { href: "/admin/people", label: "People", icon: Users, roles: ["INSTRUCTOR", "ADMIN"] },
  { href: "/admin/organizations", label: "Organizations", icon: Building2, roles: ["ADMIN"] },
  { href: "/admin/leads", label: "Demo requests", icon: Inbox, roles: ["ADMIN"] },
  { href: "/admin/inbox", label: "Inbox", icon: Mail, roles: ["ADMIN"] },
  { href: "/admin/audit", label: "Audit log", icon: ClipboardList, roles: ["INSTRUCTOR", "ADMIN"] },
];

export function AdminNav({ role, user, children }: { role: Role; user: { name: string; detail: string }; children: ReactNode }) {
  const nav = items.filter((i) => i.roles.includes(role));
  return (
    <AppShell nav={nav} user={user} context="Admin">
      {children}
    </AppShell>
  );
}
