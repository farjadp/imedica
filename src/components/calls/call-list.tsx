"use client";

import { Download, FileText } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { FormError, Select } from "@/components/ui/field";
import { ApiError, api } from "@/lib/api-client";

export type CallsPage = {
  total: number;
  all: number;
  page: number;
  pages: number;
  items: { id: string; source: string; sourceKey: string; protocol: string; turnCount: number; draftScenarioId: string | null }[];
  protocols: { protocol: string; count: number }[];
};

export function CallList({ canImport, initial }: { canImport: boolean; initial: CallsPage }) {
  const [data, setData] = useState(initial);
  const [source, setSource] = useState("");
  const [protocol, setProtocol] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function go(next: Partial<{ source: string; protocol: string; page: number }>) {
    const opts = { source, protocol, page: 1, ...next };
    setPage(opts.page);
    setLoading(true);
    setError(null);
    try {
      setData(await api<CallsPage>("GET", `/calls?${new URLSearchParams({ ...opts, page: String(opts.page) })}`));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't load the calls.");
    } finally {
      setLoading(false);
    }
  }

  async function runImport() {
    setImporting(true);
    setError(null);
    setNotice(null);
    try {
      const r = await api<{ added: number; found: number }>("POST", "/calls/import");
      setNotice(`Imported ${r.added.toLocaleString()} new calls (${r.found.toLocaleString()} found).`);
      await go({ page: 1 });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "The import didn't finish.");
    } finally {
      setImporting(false);
    }
  }

  if (data.all === 0) {
    return (
      <div className="space-y-4">
        <FormError message={error} />
        <div className="rounded-lg border border-rule bg-card p-6 text-[14px] text-ink-2">
          <p className="font-medium text-ink">No calls yet.</p>
          <p className="mt-1">
            {canImport
              ? "Import EMSDialog from Hugging Face: about 150 real calls and 1,000 synthetic ones. It takes a minute or two."
              : "An admin has to import EMSDialog first."}
          </p>
          {canImport ? (
            <Button className="mt-4" onClick={runImport} pending={importing}>
              <Download className="size-4" /> Import EMSDialog
            </Button>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <FormError message={error} />
      {notice ? <p className="rounded-md bg-pine-wash px-3 py-2 text-[14px] text-pine">{notice}</p> : null}

      <div className="flex flex-wrap items-end gap-3 rounded-lg border border-rule bg-card p-4">
        <label>
          <span className="text-[12px] text-ink-3">Calls</span>
          <Select
            className="mt-1 h-9"
            value={source}
            onChange={(e) => {
              setSource(e.target.value);
              void go({ source: e.target.value });
            }}
          >
            <option value="">Real and synthetic</option>
            <option value="EMSDialog-real">Real (de-identified)</option>
            <option value="EMSDialog-synthetic">Synthetic</option>
          </Select>
        </label>
        <label className="min-w-[260px] flex-1">
          <span className="text-[12px] text-ink-3">Protocol</span>
          <Select
            className="mt-1 h-9 w-full"
            value={protocol}
            onChange={(e) => {
              setProtocol(e.target.value);
              void go({ protocol: e.target.value });
            }}
          >
            <option value="">Any protocol</option>
            {data.protocols.map((p) => (
              <option key={p.protocol} value={p.protocol}>
                {p.protocol} ({p.count})
              </option>
            ))}
          </Select>
        </label>
        {canImport ? (
          <Button size="sm" variant="ghost" onClick={runImport} pending={importing}>
            Re-import
          </Button>
        ) : null}
      </div>

      <p className="text-[13px] text-ink-3">
        {data.total.toLocaleString()} of {data.all.toLocaleString()} calls
      </p>

      <div className="overflow-x-auto rounded-lg border border-rule bg-card">
        <table className="w-full min-w-[560px] text-left text-[14px]">
          <thead className="border-b border-rule text-[12px] text-ink-3">
            <tr>
              <th className="px-4 py-3 font-medium">Protocol</th>
              <th className="px-4 py-3 font-medium">Call</th>
              <th className="px-4 py-3 text-right font-medium">Turns</th>
              <th className="px-4 py-3 font-medium">Draft</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-rule-2">
            {data.items.map((c) => (
              <tr key={c.id} className="hover:bg-paper">
                <td className="px-4 py-3">
                  <Link href={`/admin/calls/${c.id}`} className="font-medium text-ink hover:underline">
                    {c.protocol}
                  </Link>
                </td>
                <td className="px-4 py-3 font-mono text-[12px] whitespace-nowrap text-ink-3">
                  {c.source === "EMSDialog-real" ? "real" : "synthetic"} · {c.sourceKey}
                </td>
                <td className="px-4 py-3 text-right text-ink-2">{c.turnCount}</td>
                <td className="px-4 py-3">
                  {c.draftScenarioId ? (
                    <Link href={`/admin/scenarios/${c.draftScenarioId}`} className="inline-flex items-center gap-1 text-pine hover:underline">
                      <FileText className="size-4" /> Open
                    </Link>
                  ) : (
                    <span className="text-ink-3">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data.pages > 1 ? (
        <div className="flex items-center justify-center gap-3 text-[14px]">
          <Button size="sm" variant="ghost" disabled={page <= 1 || loading} onClick={() => go({ page: page - 1 })}>
            Previous
          </Button>
          <span className="text-ink-3">
            Page {page} of {data.pages}
          </span>
          <Button size="sm" variant="ghost" disabled={page >= data.pages || loading} onClick={() => go({ page: page + 1 })}>
            Next
          </Button>
        </div>
      ) : null}
    </div>
  );
}
