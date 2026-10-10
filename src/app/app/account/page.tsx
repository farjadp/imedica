import { PageHeader, Panel } from "@/components/app/page-header";
import { roleLabel } from "@/lib/labels";
import { requireUserPage } from "@/server/auth/guards";

import { PasswordForm, ProfileForm } from "./forms";

export const metadata = { title: "Account" };

export default async function AccountPage() {
  const user = await requireUserPage("/app/account");
  return (
    <div className="space-y-6">
      <PageHeader
        title="Account"
        description={`${user.email} · ${roleLabel[user.role]}${user.organizationName ? ` at ${user.organizationName}` : ""}`}
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Profile">
          <ProfileForm
            initial={{ firstName: user.firstName, lastName: user.lastName, level: user.level, yearsExperience: user.yearsExperience }}
          />
          <p className="mt-4 text-[13px] leading-relaxed text-ink-3">
            Level and experience only reach reporting as ranges, in the de-identified analytics. Changes apply to runs
            you finish from now on.
          </p>
        </Panel>
        <Panel title="Password">
          <PasswordForm />
        </Panel>
      </div>
    </div>
  );
}
