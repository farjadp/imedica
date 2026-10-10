"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Field, FormError, Input, Select } from "@/components/ui/field";
import type { FormState } from "@/lib/form";
import { orgTypeLabel } from "@/lib/labels";
import { createOrganization } from "@/server/admin/actions";

export function OrgForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(createOrganization, {});
  const e = state.fieldErrors ?? {};
  return (
    <form action={action} className="space-y-4" noValidate>
      {state.ok ? (
        <p className="rounded-md bg-tag-green-wash p-3 text-[14px] text-ink">{state.message}</p>
      ) : (
        <FormError message={state.message} />
      )}
      <Field label="Name" error={e.name}>
        {(p) => <Input {...p} name="name" required />}
      </Field>
      <Field label="Type" error={e.type}>
        {(p) => (
          <Select {...p} name="type" defaultValue="EMS_SERVICE">
            {Object.entries(orgTypeLabel).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </Select>
        )}
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Province" error={e.province}>
          {(p) => <Input {...p} name="province" defaultValue="ON" maxLength={2} />}
        </Field>
        <Field label="Seats" error={e.seatLimit}>
          {(p) => <Input {...p} name="seatLimit" type="number" min={1} defaultValue={25} />}
        </Field>
      </div>
      <Button type="submit" className="w-full" pending={pending}>
        Add organization
      </Button>
    </form>
  );
}
