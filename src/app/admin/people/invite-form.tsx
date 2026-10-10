"use client";

import { Copy } from "lucide-react";
import { useActionState, useState } from "react";

import { Button } from "@/components/ui/button";
import { Field, FormError, Input, Select } from "@/components/ui/field";
import { type InviteResult, inviteUser } from "@/server/admin/actions";

export function InviteForm({
  isAdmin,
  organizations,
  defaultOrganizationId,
}: {
  isAdmin: boolean;
  organizations: { id: string; name: string }[];
  defaultOrganizationId?: string;
}) {
  const [state, action, pending] = useActionState<InviteResult, FormData>(inviteUser, {});
  const [copied, setCopied] = useState(false);
  const e = state.fieldErrors ?? {};

  return (
    <form action={action} className="space-y-4" noValidate>
      {state.ok ? (
        <div className="space-y-2 rounded-md border border-tag-green/30 bg-tag-green-wash p-3 text-[14px] text-ink">
          <p>{state.message}</p>
          {state.link ? (
            <button
              type="button"
              onClick={() => navigator.clipboard.writeText(state.link!).then(() => setCopied(true))}
              className="inline-flex items-center gap-1.5 text-[13px] text-pine-3 hover:underline"
            >
              <Copy className="size-3.5" /> {copied ? "Link copied" : "Copy the invitation link"}
            </button>
          ) : null}
        </div>
      ) : (
        <FormError message={state.message} />
      )}
      <Field label="Email" error={e.email}>
        {(p) => <Input {...p} name="email" type="email" autoComplete="off" required />}
      </Field>
      <Field label="Role" error={e.role}>
        {(p) => (
          <Select {...p} name="role" defaultValue="PARAMEDIC">
            <option value="PARAMEDIC">Paramedic</option>
            <option value="INSTRUCTOR">Instructor</option>
            {isAdmin ? <option value="PHYSICIAN">Physician</option> : null}
            {isAdmin ? <option value="ADMIN">Imedica admin</option> : null}
          </Select>
        )}
      </Field>
      {isAdmin ? (
        <Field label="Organization" error={e.organizationId}>
          {(p) => (
            <Select {...p} name="organizationId" defaultValue={defaultOrganizationId ?? ""}>
              <option value="">Choose…</option>
              {organizations.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </Select>
          )}
        </Field>
      ) : null}
      <Button type="submit" className="w-full" pending={pending}>
        Send invitation
      </Button>
      <p className="text-[12px] text-ink-3">Invitations expire after seven days.</p>
    </form>
  );
}
