import type { Metadata } from "next";

import { LearnerNav } from "@/components/app/learner-nav";
import { roleLabel } from "@/lib/labels";
import { requireUserPage } from "@/server/auth/guards";

export const metadata: Metadata = { title: { default: "Training", template: "%s · Imedica" }, robots: { index: false } };

export default async function LearnerLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUserPage("/app");
  return (
    <LearnerNav
      staff={user.role !== "PARAMEDIC"}
      user={{
        name: `${user.firstName} ${user.lastName}`,
        detail: user.organizationName ?? roleLabel[user.role],
      }}
    >
      {children}
    </LearnerNav>
  );
}
