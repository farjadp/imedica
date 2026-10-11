import type { Metadata } from "next";

import { AdminNav } from "@/components/app/admin-nav";
import { roleLabel } from "@/lib/labels";
import { requireRolePage, STAFF_ROLES } from "@/server/auth/guards";
import { internalDatasetsEnabled } from "@/server/question-bank/service";

export const metadata: Metadata = { title: { default: "Admin", template: "%s · Imedica admin" }, robots: { index: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRolePage(STAFF_ROLES, "/admin");
  return (
    <AdminNav
      role={user.role}
      internal={internalDatasetsEnabled()}
      user={{
        name: `${user.firstName} ${user.lastName}`,
        detail: user.organizationName ? `${roleLabel[user.role]} · ${user.organizationName}` : roleLabel[user.role],
      }}
    >
      {children}
    </AdminNav>
  );
}
