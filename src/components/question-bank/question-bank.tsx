"use client";

import { Check, Download, Search } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { FormError, Input, Select } from "@/components/ui/field";
import { ApiError, api } from "@/lib/api-client";

type BankQuestion = {
  id: string;
  source: string;
  origin: string | null;
  levels: string[];
  categories: string[];
  stem: string;
  options: string[];
  correctIndex: number;
  explanation: string | null;
};
export type BankPage = {
  total: number;
  all: number;
  page: number;
  pages: number;
  items: BankQuestion[];
};

const LEVELS = [
  ["paramedic", "Paramedic"],
  ["aemt", "AEMT"],
  ["emt", "EMT"],
  ["emr", "EMR"],
] as const;

const CATEGORIES = [
  "cardiology_and_resuscitation",
  "airway_respiration_and_ventilation",
  "trauma",
  "medical_and_obstetrics_gynecology",
  "pharmacology",
  "pediatrics",
  "assessment",
  "anatomy",
  "ems_operations",
];

const label = (c: string) => c.replace(/_/g, " ").replace(/^\w/, (x) => x.toUpperCase());
const LETTERS = "ABCDEF";

export function QuestionBank({
  canImport,
  drafts,
  initial,
}: {
  canImport: boolean;
  drafts: { id: string; title: string }[];
  initial: BankPage;
}) {
  const [q, setQ] = useState("");
  const [level, setLevel] = useState("paramedic");
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<BankPage>(initial);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [target, setTarget] = useState(drafts[0]?.id ?? "");
  const [added, setAdded] = useState<Record<string, string>>({});

  async function load(opts: { q: string; level: string; category: string; page: number }) {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ ...opts, page: String(opts.page) });
      setData(await api<BankPage>("GET", `/question-bank?${params}`));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't load the question bank.");
    } finally {
      setLoading(false);
    }
  }

  function go(next: Partial<{ q: string; level: string; category: string; page: number }>) {
    const opts = { q, level, category, page: 1, ...next };
    setPage(opts.page);
    void load(opts);
  }

  async function runImport() {
    setImporting(true);
    setError(null);
    setNotice(null);
    try {
      const r = await api<{ added: number; usable: number; skipped: number }>("POST", "/question-bank/import");
      setNotice(
        `Imported ${r.added.toLocaleString()} new questions (${r.usable.toLocaleString()} usable, ${r.skipped.toLocaleString()} skipped as multi-answer, malformed or duplicate).`,
      );
      go({ page: 1 });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "The import didn't finish.");
    } finally {
      setImporting(false);
    }
  }

  async function add(id: string) {
    setError(null);
    try {
      await api("POST", `/question-bank/${id}/add`, { assessmentId: target });
      setAdded((a) => ({ ...a, [id]: target }));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't add that question.");
    }
  }

  const empty = data.all === 0;

  return (
    <div className="space-y-4">
      <FormError message={error} />
      {notice ? <p className="rounded-md bg-pine-wash px-3 py-2 text-[14px] text-pine">{notice}</p> : null}

      {empty ? (
        <div className="rounded-lg border border-rule bg-card p-6 text-[14px] text-ink-2">
          <p className="font-medium text-ink">The bank is empty.</p>
          <p className="mt-1">
            {canImport
              ? "Import EMS-MCQA from Hugging Face (about 18,600 questions, 12 MB). Multi-answer and malformed questions are skipped."
              : "An admin has to import EMS-MCQA first."}
          </p>
          {canImport ? (
            <Button className="mt-4" onClick={runImport} pending={importing}>
              <Download className="size-4" /> Import EMS-MCQA
            </Button>
          ) : null}
        </div>
      ) : null}

      {!empty ? (
        <>
          <form
            className="flex flex-wrap items-end gap-3 rounded-lg border border-rule bg-card p-4"
            onSubmit={(e) => {
              e.preventDefault();
              go({});
            }}
          >
            <label className="min-w-[220px] flex-1">
              <span className="text-[12px] text-ink-3">Search the question text</span>
              <Input className="mt-1 h-9" value={q} onChange={(e) => setQ(e.target.value)} placeholder="e.g. nitroglycerin" />
            </label>
            <label>
              <span className="text-[12px] text-ink-3">Level</span>
              <Select
                className="mt-1 h-9"
                value={level}
                onChange={(e) => {
                  setLevel(e.target.value);
                  go({ level: e.target.value });
                }}
              >
                <option value="">Any level</option>
                {LEVELS.map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </Select>
            </label>
            <label>
              <span className="text-[12px] text-ink-3">Topic</span>
              <Select
                className="mt-1 h-9"
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  go({ category: e.target.value });
                }}
              >
                <option value="">Any topic</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {label(c)}
                  </option>
                ))}
              </Select>
            </label>
            <Button type="submit" size="sm" variant="secondary" pending={loading}>
              <Search className="size-4" /> Search
            </Button>
          </form>

          <div className="flex flex-wrap items-center justify-between gap-3 text-[13px] text-ink-3">
            <p>
              {`${data.total.toLocaleString()} of ${data.all.toLocaleString()} questions`}
              {canImport ? (
                <button type="button" onClick={runImport} disabled={importing} className="ml-3 underline hover:text-ink">
                  {importing ? "Importing…" : "Re-import"}
                </button>
              ) : null}
            </p>
            {drafts.length ? (
              <label className="flex items-center gap-2 whitespace-nowrap">
                Add to
                <Select className="h-8 max-w-[260px]" value={target} onChange={(e) => setTarget(e.target.value)}>
                  {drafts.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.title}
                    </option>
                  ))}
                </Select>
              </label>
            ) : (
              <p>
                <Link href="/admin/assessments/new" className="underline">
                  Create a draft assessment
                </Link>{" "}
                to add questions to it.
              </p>
            )}
          </div>

          <ol className="space-y-3">
            {data.items.map((item) => (
              <li key={item.id} className="rounded-lg border border-rule bg-card p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <p className="max-w-[70ch] text-[15px] font-medium text-ink">{item.stem}</p>
                  {added[item.id] ? (
                    <span className="inline-flex items-center gap-1 text-[13px] text-pine">
                      <Check className="size-4" /> Added
                    </span>
                  ) : drafts.length ? (
                    <Button size="sm" variant="secondary" onClick={() => add(item.id)}>
                      Add
                    </Button>
                  ) : null}
                </div>
                <ul className="mt-2 space-y-1 text-[14px]">
                  {item.options.map((o, i) => (
                    <li key={i} className={i === item.correctIndex ? "font-medium text-pine" : "text-ink-2"}>
                      {LETTERS[i]}. {o}
                      {i === item.correctIndex ? " ✓" : ""}
                    </li>
                  ))}
                </ul>
                {item.explanation ? <p className="mt-2 text-[13px] text-ink-3">{item.explanation}</p> : null}
                <p className="mt-2 font-mono text-[11px] text-ink-3">
                  {[...item.levels, ...item.categories.map(label)].join(" · ")}
                  {item.origin ? ` · from ${new URL(item.origin).hostname}` : ""}
                </p>
              </li>
            ))}
          </ol>

          {data.pages > 1 ? (
            <div className="flex items-center justify-center gap-3 text-[14px]">
              <Button size="sm" variant="ghost" disabled={page <= 1 || loading} onClick={() => go({ page: page - 1 })}>
                Previous
              </Button>
              <span className="text-ink-3">
                Page {page} of {data.pages.toLocaleString()}
              </span>
              <Button size="sm" variant="ghost" disabled={page >= data.pages || loading} onClick={() => go({ page: page + 1 })}>
                Next
              </Button>
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
