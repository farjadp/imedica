"use client";

import { Activity, BookOpen, Building2, ClipboardCheck, ClipboardList, Gauge, Inbox, ListChecks, Mail, Newspaper, Sparkles, Timer, Users } from "lucide-react";
import type { ReactNode } from "react";

import type { Role } from "@/generated/prisma/enums";

import { AppShell, type NavItem } from "./app-shell";

// `internal` items only show when INTERNAL_DATASETS is on.
const items: (NavItem & { roles: Role[]; internal?: boolean })[] = [
  { href: "/admin", label: "Overview", icon: Gauge, exact: true, roles: ["INSTRUCTOR", "PHYSICIAN", "ADMIN"] },
  { href: "/admin/scenarios", label: "Scenarios", icon: BookOpen, roles: ["PHYSICIAN", "ADMIN"] },
  { href: "/admin/assessments", label: "Assessments", icon: ClipboardCheck, roles: ["PHYSICIAN", "ADMIN"] },
  { href: "/admin/question-bank", label: "Question bank", icon: ListChecks, roles: ["PHYSICIAN", "ADMIN"], internal: true },
  { href: "/admin/blog", label: "Blog", icon: Newspaper, roles: ["PHYSICIAN", "ADMIN"] },
  { href: "/admin/ai", label: "AI review", icon: Sparkles, roles: ["PHYSICIAN", "ADMIN"] },
  { href: "/admin/analytics", label: "Team readiness", icon: Activity, roles: ["INSTRUCTOR", "ADMIN"] },
  { href: "/admin/assessment-windows", label: "Pre/post tests", icon: Timer, roles: ["INSTRUCTOR", "ADMIN"] },
  { href: "/admin/people", label: "People", icon: Users, roles: ["INSTRUCTOR", "ADMIN"] },
  { href: "/admin/organizations", label: "Organizations", icon: Building2, roles: ["ADMIN"] },
  { href: "/admin/leads", label: "Demo requests", icon: Inbox, roles: ["ADMIN"] },
  { href: "/admin/inbox", label: "Inbox", icon: Mail, roles: ["ADMIN"] },
  { href: "/admin/audit", label: "Audit log", icon: ClipboardList, roles: ["INSTRUCTOR", "ADMIN"] },
];

export function AdminNav({
  role,
  user,
  internal = false,
  children,
}: {
  role: Role;
  user: { name: string; detail: string };
  internal?: boolean;
  children: ReactNode;
}) {
  const nav = items.filter((i) => i.roles.includes(role) && (internal || !i.internal));
  return (
    <AppShell nav={nav} user={user} context="Admin">
      {children}
    </AppShell>
  );
}
