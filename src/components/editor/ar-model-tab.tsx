"use client";

import { CheckCircle2, Clock, Plus } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Field, FormError, Input, Textarea } from "@/components/ui/field";
import { api } from "@/lib/api-client";

import type { EArModel, EditorScenario } from "./types";
import { useMutation } from "./use-mutation";

// The scenario's 3D casualty for "View the patient in your room".
// Each save adds a version; learners get the newest one a second physician
// has reviewed. Files live in public/models/<slug>/v<n>/ or at an https URL.

function AttachForm({ scenario, onDone }: { scenario: EditorScenario; onDone: () => void }) {
  const m = useMutation();
  const latest = scenario.arModels[0];
  const [glbUrl, setGlb] = useState(latest?.glbUrl ?? "");
  const [usdzUrl, setUsdz] = useState(latest?.usdzUrl ?? "");
  const [posterUrl, setPoster] = useState(latest?.posterUrl ?? "");
  const [heightMeters, setHeight] = useState(String(latest?.heightMeters ?? "1.75"));
  const [licence, setLicence] = useState(latest?.licence ?? "");
  const [source, setSource] = useState(latest?.source ?? "");
  const [hotspots, setHotspots] = useState(latest ? JSON.stringify(latest.hotspots ?? [], null, 2) : "[]");
  const [jsonError, setJsonError] = useState<string | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    let parsed: unknown;
    try {
      parsed = JSON.parse(hotspots || "[]");
      setJsonError(null);
    } catch {
      setJsonError("Hotspots must be valid JSON, e.g. [].");
      return;
    }
    const payload = { glbUrl, usdzUrl, posterUrl: posterUrl || null, heightMeters, licence, source, hotspots: parsed };
    if (await m.run(() => api("POST", `/scenarios/${scenario.id}/ar-models`, payload))) onDone();
  }

  return (
    <form onSubmit={save} className="space-y-4 rounded-lg border border-pine-3/40 bg-card p-5" noValidate>
      <FormError message={m.error} />
      <Field label="USDZ file (iPhone)" hint="/models/<slug>/v<n>/patient.usdz or an https:// URL." error={m.fields.usdzUrl}>
        {(p) => <Input {...p} value={usdzUrl} onChange={(e) => setUsdz(e.target.value)} />}
      </Field>
      <Field label="GLB file (Android and web)" error={m.fields.glbUrl}>
        {(p) => <Input {...p} value={glbUrl} onChange={(e) => setGlb(e.target.value)} />}
      </Field>
      <Field label="Poster image" hint="Optional. Shown while the model loads." error={m.fields.posterUrl}>
        {(p) => <Input {...p} value={posterUrl} onChange={(e) => setPoster(e.target.value)} />}
      </Field>
      <Field label="Real height or length (m)" hint="The viewers lock this scale." error={m.fields.heightMeters}>
        {(p) => <Input {...p} inputMode="decimal" value={heightMeters} onChange={(e) => setHeight(e.target.value)} />}
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Licence" hint="e.g. CC0-1.0, or the contract reference." error={m.fields.licence}>
          {(p) => <Input {...p} value={licence} onChange={(e) => setLicence(e.target.value)} />}
        </Field>
        <Field label="Source" hint="Who made it and where it came from." error={m.fields.source}>
          {(p) => <Input {...p} value={source} onChange={(e) => setSource(e.target.value)} />}
        </Field>
      </div>
      <Field
        label="Hotspots (JSON)"
        hint='Leave [] for now. Format: [{"node":"wound_thigh_left","label":"Left thigh wound","region":"left_leg"}]'
        error={jsonError ?? m.fields.hotspots}
      >
        {(p) => <Textarea {...p} rows={3} className="font-mono text-[13px]" value={hotspots} onChange={(e) => setHotspots(e.target.value)} />}
      </Field>
      <p className="text-[13px] text-ink-3">Saving adds a new version. It isn&apos;t shown to learners until another physician reviews it.</p>
      <div className="flex gap-2">
        <Button type="submit" pending={m.pending}>
          Save as version {(latest?.version ?? 0) + 1}
        </Button>
        <Button type="button" variant="ghost" onClick={onDone}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

function VersionRow({
  model,
  served,
  scenarioId,
  me,
}: {
  model: EArModel;
  served: boolean;
  scenarioId: string;
  me: { id: string; role: string };
}) {
  const m = useMutation();
  const mine = model.createdById === me.id && me.role !== "ADMIN";
  const review = (action: "approve" | "revoke") =>
    m.run(() => api("POST", `/scenarios/${scenarioId}/ar-models/${model.id}/review`, { action }));

  return (
    <li className="rounded-lg border border-rule bg-card p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1 text-[14px] text-ink-2">
          <p className="flex flex-wrap items-center gap-2 text-[15px] font-medium text-ink">
            Version {model.version}
            {served ? <span className="rounded-full bg-paper-2 px-2 text-[12px] font-normal text-tag-green">shown to learners</span> : null}
          </p>
          <p className="break-all">
            <a className="hover:text-ink hover:underline" href={model.usdzUrl}>USDZ</a> ·{" "}
            <a className="hover:text-ink hover:underline" href={model.glbUrl}>GLB</a>
            {model.posterUrl ? (
              <>
                {" "}· <a className="hover:text-ink hover:underline" href={model.posterUrl}>poster</a>
              </>
            ) : null}{" "}
            · {model.heightMeters} m
          </p>
          <p className="text-[13px] text-ink-3">
            {model.licence} · {model.source}
          </p>
          {model.reviewedAt ? (
            <p className="inline-flex items-center gap-1.5 text-[13px] text-tag-green">
              <CheckCircle2 className="size-4" /> Physician-reviewed {new Date(model.reviewedAt).toLocaleDateString()}
            </p>
          ) : (
            <p className="inline-flex items-center gap-1.5 text-[13px] text-tag-yellow">
              <Clock className="size-4" /> Awaiting physician review. Not shown to learners.
            </p>
          )}
        </div>
        <div className="shrink-0 space-y-2">
          {model.reviewedAt ? (
            <Button variant="secondary" pending={m.pending} onClick={() => confirm("Stop showing this model to learners?") && void review("revoke")}>
              Withdraw review
            </Button>
          ) : (
            <Button pending={m.pending} disabled={mine} onClick={() => void review("approve")}>
              Mark physician-reviewed
            </Button>
          )}
          {mine && !model.reviewedAt ? <p className="max-w-[16rem] text-[12px] text-ink-3">Another physician has to review the model you attached.</p> : null}
          <FormError message={m.error} />
        </div>
      </div>
    </li>
  );
}

export function ArModelTab({ scenario, me }: { scenario: EditorScenario; me: { id: string; role: string } }) {
  const [adding, setAdding] = useState(false);
  const servedId = scenario.arModels.find((x) => x.reviewedAt)?.id;
  const archived = scenario.status === "ARCHIVED";

  return (
    <div className="max-w-3xl space-y-4">
      <p className="text-[14px] text-ink-2">
        A 3D casualty learners can place in their room before the call starts (iPhone AR Quick Look, Android Scene Viewer,
        or in the browser). Check the wounds, skin colour and posture before you review it, as you would the written scenario.
      </p>
      {scenario.arModels.length ? (
        <ul className="space-y-3">
          {scenario.arModels.map((x) => (
            <VersionRow key={x.id} model={x} served={x.id === servedId} scenarioId={scenario.id} me={me} />
          ))}
        </ul>
      ) : (
        <p className="text-[14px] text-ink-3">No 3D model yet.</p>
      )}
      {archived ? null : adding ? (
        <AttachForm scenario={scenario} onDone={() => setAdding(false)} />
      ) : (
        <Button variant="secondary" onClick={() => setAdding(true)}>
          <Plus className="size-4" /> {scenario.arModels.length ? "Replace with a new version" : "Attach a 3D model"}
        </Button>
      )}
    </div>
  );
}
