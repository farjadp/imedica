"use client";

import { CheckCircle2 } from "lucide-react";
import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Field, FormError, Input, Select, Textarea } from "@/components/ui/field";
import type { FormState } from "@/lib/form";
import { cn } from "@/lib/cn";
import { CONTACT_TOPICS, TRACKS } from "@/lib/inbox";
import { applyForRole, joinAppWaitlist, sendContact } from "@/server/inbox/actions";

function Honeypot() {
  return (
    <div className="hidden" aria-hidden>
      <label>
        Website
        <input name="website" tabIndex={-1} autoComplete="off" />
      </label>
    </div>
  );
}

function Sent({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-tag-green/30 bg-tag-green-wash p-8" role="status">
      <CheckCircle2 className="size-7 text-tag-green" aria-hidden />
      <h2 className="mt-4 font-display text-2xl font-medium text-ink">{title}</h2>
      <p className="mt-2 text-[15px] leading-relaxed text-ink-2">{body}</p>
    </div>
  );
}

const card = "space-y-5 rounded-2xl border border-rule bg-card p-6 text-ink shadow-[var(--shadow-float)] md:p-8";

export function ContactForm({ defaultTopic }: { defaultTopic?: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(sendContact, {});
  const e = state.fieldErrors ?? {};
  if (state.ok) return <Sent title="Message sent." body="Someone from the team will reply within two business days." />;
  return (
    <form action={action} className={card} noValidate>
      <FormError message={state.message} />
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Your name" error={e.name}>
          {(p) => <Input {...p} name="name" autoComplete="name" required />}
        </Field>
        <Field label="Email" error={e.email}>
          {(p) => <Input {...p} name="email" type="email" autoComplete="email" required />}
        </Field>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Organization" hint="Optional" error={e.organization}>
          {(p) => <Input {...p} name="organization" autoComplete="organization" />}
        </Field>
        <Field label="Topic" error={e.topic}>
          {(p) => (
            <Select {...p} name="topic" defaultValue={defaultTopic ?? "General"}>
              {CONTACT_TOPICS.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </Select>
          )}
        </Field>
      </div>
      <Field label="Message" error={e.message}>
        {(p) => <Textarea {...p} name="message" rows={5} required />}
      </Field>
      <Honeypot />
      <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[13px] text-ink-3">We only use these details to reply to you.</p>
        <Button type="submit" size="lg" pending={pending}>
          Send message
        </Button>
      </div>
    </form>
  );
}

export function CareersForm({ defaultTrack }: { defaultTrack?: (typeof TRACKS)[number] }) {
  const [state, action, pending] = useActionState<FormState, FormData>(applyForRole, {});
  const e = state.fieldErrors ?? {};
  if (state.ok) return <Sent title="Thanks for reaching out." body="We read every application. If there's a fit, we'll write to you within two weeks." />;
  return (
    <form action={action} className={card} noValidate>
      <FormError message={state.message} />
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Your name" error={e.name}>
          {(p) => <Input {...p} name="name" autoComplete="name" required />}
        </Field>
        <Field label="Email" error={e.email}>
          {(p) => <Input {...p} name="email" type="email" autoComplete="email" required />}
        </Field>
      </div>
      <Field label="Track" error={e.topic}>
        {(p) => (
          <Select {...p} name="topic" defaultValue={defaultTrack ?? "Software engineer"}>
            {TRACKS.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </Select>
        )}
      </Field>
      <Field label="Links" hint="LinkedIn, GitHub, a portfolio or a publication. Separate several with spaces." error={e.links}>
        {(p) => <Input {...p} name="links" placeholder="linkedin.com/in/…" required />}
      </Field>
      <Field label="Why Imedica, and what you'd bring" error={e.message}>
        {(p) => <Textarea {...p} name="message" rows={5} required />}
      </Field>
      <Honeypot />
      <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[13px] text-ink-3">No CV upload: a link is enough to start.</p>
        <Button type="submit" size="lg" pending={pending}>
          Apply
        </Button>
      </div>
    </form>
  );
}

export function WaitlistForm({ tone = "dark" }: { tone?: "dark" | "light" }) {
  const [state, action, pending] = useActionState<FormState, FormData>(joinAppWaitlist, {});
  const e = state.fieldErrors ?? {};
  const dark = tone === "dark";
  if (state.ok) {
    return (
      <p className={cn("flex items-center gap-2 text-[15px]", dark ? "text-[#9ff0c4]" : "text-tag-green")} role="status">
        <CheckCircle2 className="size-5" /> You&apos;re on the list. We&apos;ll email you on launch day.
      </p>
    );
  }
  return (
    <form action={action} noValidate className="w-full max-w-xl">
      <div className="flex flex-col gap-2 sm:flex-row">
        <label htmlFor="wl-email" className="sr-only">
          Email
        </label>
        <input
          id="wl-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="you@service.ca"
          aria-invalid={e.email ? true : undefined}
          className={cn(
            "h-12 min-w-0 flex-1 rounded-full border px-5 text-[15px] focus:outline-none",
            dark ? "border-white/15 bg-white/[0.06] text-paper placeholder:text-paper/40 focus:border-[#9ff0c4]/60" : "border-rule bg-card text-ink focus:border-pine-3",
          )}
        />
        <label htmlFor="wl-phone" className="sr-only">
          Phone
        </label>
        <select
          id="wl-phone"
          name="topic"
          defaultValue="iPhone"
          className={cn(
            "h-12 rounded-full border px-5 text-[15px] focus:outline-none",
            dark ? "border-white/15 bg-[#0b1714] text-paper" : "border-rule bg-card text-ink",
          )}
        >
          <option>iPhone</option>
          <option>Android</option>
        </select>
        <Honeypot />
        <Button type="submit" size="lg" variant={dark ? "light" : "primary"} pending={pending} className="h-12 rounded-full">
          Notify me
        </Button>
      </div>
      {e.email || state.message ? <p className={cn("mt-2 text-[13px]", dark ? "text-[#ff8a80]" : "text-tag-red")}>{e.email ?? state.message}</p> : null}
    </form>
  );
}
