"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Field, FormError, Input, Select, Textarea } from "@/components/ui/field";
import type { FormState } from "@/lib/form";
import { changePassword, deleteAvatar, updateProfile, uploadAvatar } from "@/server/account/actions";

function Saved({ state }: { state: FormState }) {
  return state.ok ? <span className="text-[13px] text-tag-green">{state.message}</span> : null;
}

type ProfileInitial = {
  firstName: string;
  lastName: string;
  preferredName: string | null;
  pronouns: string | null;
  level: string | null;
  yearsExperience: number | null;
  station: string | null;
  bio: string | null;
  certifications: string[];
  notifyAssessments: boolean;
};

export function ProfileForm({ initial }: { initial: ProfileInitial }) {
  const [state, action, pending] = useActionState<FormState, FormData>(updateProfile, {});
  const e = state.fieldErrors ?? {};
  return (
    <form action={action} className="space-y-4" noValidate>
      <FormError message={state.ok ? null : state.message} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="First name" error={e.firstName}>
          {(p) => <Input {...p} name="firstName" defaultValue={initial.firstName} autoComplete="given-name" />}
        </Field>
        <Field label="Last name" error={e.lastName}>
          {(p) => <Input {...p} name="lastName" defaultValue={initial.lastName} autoComplete="family-name" />}
        </Field>
        <Field label="Preferred name" hint="What the app greets you with." error={e.preferredName}>
          {(p) => <Input {...p} name="preferredName" defaultValue={initial.preferredName ?? ""} autoComplete="nickname" />}
        </Field>
        <Field label="Pronouns" error={e.pronouns}>
          {(p) => <Input {...p} name="pronouns" defaultValue={initial.pronouns ?? ""} placeholder="e.g. she/her" />}
        </Field>
        <Field label="Level" error={e.level}>
          {(p) => (
            <Select {...p} name="level" defaultValue={initial.level ?? ""}>
              <option value="">Prefer not to say</option>
              <option value="PCP">PCP</option>
              <option value="ACP">ACP</option>
              <option value="CCP">CCP</option>
              <option value="EMR">EMR</option>
              <option value="STUDENT">Student</option>
              <option value="OTHER">Other</option>
            </Select>
          )}
        </Field>
        <Field label="Years in practice" error={e.yearsExperience}>
          {(p) => <Input {...p} name="yearsExperience" type="number" min={0} max={60} defaultValue={initial.yearsExperience ?? ""} />}
        </Field>
        <Field label="Station or base" error={e.station} className="sm:col-span-2">
          {(p) => <Input {...p} name="station" defaultValue={initial.station ?? ""} placeholder="e.g. Station 12, Newmarket" />}
        </Field>
        <Field label="Certifications" hint="Separate with commas, e.g. ACLS, PALS, ITLS." error={e.certifications} className="sm:col-span-2">
          {(p) => <Input {...p} name="certifications" defaultValue={initial.certifications.join(", ")} />}
        </Field>
        <Field label="About you" hint="Up to 280 characters." error={e.bio} className="sm:col-span-2">
          {(p) => <Textarea {...p} name="bio" maxLength={280} defaultValue={initial.bio ?? ""} />}
        </Field>
      </div>
      <label className="flex items-start gap-3 text-[14px] text-ink-2">
        <input type="checkbox" name="notifyAssessments" defaultChecked={initial.notifyAssessments} className="mt-1 size-4 accent-pine" />
        <span>Notify my phone when my service opens a pre- or post-test.</span>
      </label>
      <div className="flex items-center gap-3">
        <Button type="submit" pending={pending}>
          Save
        </Button>
        <Saved state={state} />
      </div>
    </form>
  );
}

export function AvatarForm({ name, version }: { name: string; version: string | null }) {
  const [state, upload, pending] = useActionState<FormState, FormData>(uploadAvatar, {});
  const [, remove, removing] = useActionState<FormState, FormData>(deleteAvatar, {});
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <div className="flex items-center gap-5">
      {version ? (
        // eslint-disable-next-line @next/next/no-img-element -- private, cookie-authenticated image
        <img src={`/api/v1/me/avatar?v=${version}`} alt="" className="size-20 rounded-full border border-rule object-cover" />
      ) : (
        <div className="grid size-20 place-items-center rounded-full bg-pine font-serif text-[26px] text-paper">{initials}</div>
      )}
      <div className="space-y-2">
        <form action={upload} className="flex flex-wrap items-center gap-2">
          <input
            type="file"
            name="file"
            accept="image/jpeg,image/png,image/webp"
            required
            className="max-w-60 text-[13px] text-ink-2 file:mr-3 file:rounded-md file:border file:border-rule file:bg-card file:px-3 file:py-1.5 file:text-[13px] file:text-ink"
          />
          <Button type="submit" size="sm" variant="secondary" pending={pending}>
            Upload
          </Button>
        </form>
        <div className="flex items-center gap-3 text-[13px]">
          <span className="text-ink-3">JPEG, PNG or WebP, up to 2 MB. Only you and your account see it.</span>
          {version ? (
            <form action={remove}>
              <button type="submit" disabled={removing} className="text-tag-red underline-offset-2 hover:underline">
                Remove
              </button>
            </form>
          ) : null}
        </div>
        {state.message && !state.ok ? <p className="text-[13px] text-tag-red">{state.message}</p> : null}
      </div>
    </div>
  );
}

export function PasswordForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(changePassword, {});
  const e = state.fieldErrors ?? {};
  return (
    <form action={action} className="space-y-4" noValidate>
      <Field label="Current password" error={e.current}>
        {(p) => <Input {...p} name="current" type="password" autoComplete="current-password" />}
      </Field>
      <Field label="New password" hint="At least 12 characters, with a letter and a number." error={e.password}>
        {(p) => <Input {...p} name="password" type="password" autoComplete="new-password" />}
      </Field>
      <Field label="Confirm new password" error={e.confirm}>
        {(p) => <Input {...p} name="confirm" type="password" autoComplete="new-password" />}
      </Field>
      <div className="flex items-center gap-3">
        <Button type="submit" variant="secondary" pending={pending}>
          Change password
        </Button>
        <Saved state={state} />
      </div>
    </form>
  );
}
