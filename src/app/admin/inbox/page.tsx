import { ExternalLink } from "lucide-react";
import Link from "next/link";

import { InlineAction } from "@/components/app/inline-action";
import { EmptyState, PageHeader } from "@/components/app/page-header";
import type { MessageKind } from "@/generated/prisma/enums";
import { cn } from "@/lib/cn";
import { formatDateTime } from "@/lib/labels";
import { requireRolePage } from "@/server/auth/guards";
import { db } from "@/server/db";
import { setMessageHandled } from "@/server/inbox/admin";

export const metadata = { title: "Inbox" };

const TABS: { key: MessageKind; label: string; empty: string }[] = [
  { key: "CONTACT", label: "Contact", empty: "Messages from the contact page land here." },
  { key: "CAREERS", label: "Careers", empty: "Applications from the careers page land here." },
  { key: "APP_WAITLIST", label: "App launch list", empty: "People who asked to be told when the apps launch." },
];

export default async function InboxPage({ searchParams }: { searchParams: Promise<{ kind?: string; show?: string }> }) {
  await requireRolePage(["ADMIN"], "/admin/inbox");
  const sp = await searchParams;
  const kind = (TABS.find((t) => t.key === sp.kind)?.key ?? "CONTACT") as MessageKind;
  const showAll = sp.show === "all";

  const [messages, open] = await Promise.all([
    db.inboundMessage.findMany({
      where: { kind, ...(showAll ? {} : { handled: false }) },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    db.inboundMessage.groupBy({ by: ["kind"], where: { handled: false }, _count: true }),
  ]);
  const openCount = Object.fromEntries(open.map((o) => [o.kind, o._count])) as Partial<Record<MessageKind, number>>;
  const tab = TABS.find((t) => t.key === kind)!;
  const href = (k: MessageKind, all = showAll) => `/admin/inbox?kind=${k}${all ? "&show=all" : ""}`;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inbox"
        description="What the public sends from the contact, careers and app pages. Each one is also emailed to the team; reply by email, then mark it handled."
      />
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <nav className="flex flex-wrap gap-1.5" aria-label="Message type">
          {TABS.map((t) => (
            <Link
              key={t.key}
              href={href(t.key)}
              className={cn("inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[13px]", kind === t.key ? "bg-ink text-paper" : "bg-card text-ink-2 ring-1 ring-rule hover:text-ink")}
            >
              {t.label}
              {openCount[t.key] ? <span className="tabular rounded-full bg-signal px-1.5 text-[11px] text-white">{openCount[t.key]}</span> : null}
            </Link>
          ))}
        </nav>
        <Link href={href(kind, !showAll)} className="text-[13px] text-ink-3 hover:text-ink">
          {showAll ? "Hide handled" : "Show handled too"}
        </Link>
      </div>

      {messages.length === 0 ? (
        <EmptyState title={showAll ? "Nothing yet" : "All caught up"} body={tab.empty} />
      ) : kind === "APP_WAITLIST" ? (
        <div className="overflow-x-auto rounded-lg border border-rule bg-card">
          <table className="w-full min-w-[520px] text-left text-[14px]">
            <thead className="border-b border-rule text-[12px] text-ink-3">
              <tr>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Phone</th>
                <th className="px-4 py-3 font-medium">Signed up</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rule-2">
              {messages.map((m) => (
                <tr key={m.id}>
                  <td className="px-4 py-3 text-ink">{m.email}</td>
                  <td className="px-4 py-3 text-ink-2">{m.topic}</td>
                  <td className="px-4 py-3 text-ink-3">{formatDateTime(m.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <ul className="space-y-3">
          {messages.map((m) => (
            <li key={m.id} className={cn("rounded-lg border border-rule bg-card p-5", m.handled && "opacity-60")}>
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0">
                  <p className="text-[15px] font-medium text-ink">
                    {m.name ?? m.email}
                    {m.organization ? <span className="font-normal text-ink-2"> · {m.organization}</span> : null}
                    {m.topic ? <span className="ml-2 inline-flex h-5 items-center rounded-full bg-paper-2 px-2 align-middle text-[11px] font-normal text-ink-2">{m.topic}</span> : null}
                  </p>
                  <p className="text-[13px] text-ink-3">
                    <a href={`mailto:${m.email}`} className="text-pine-3 underline">
                      {m.email}
                    </a>{" "}
                    · {formatDateTime(m.createdAt)}
                  </p>
                  {m.links ? (
                    <p className="mt-2 flex flex-wrap gap-x-3 text-[13px]">
                      {m.links.split(/[\s,]+/).filter(Boolean).map((l) => {
                        const url = /^https?:\/\//i.test(l) ? l : `https://${l}`;
                        return (
                          <a key={l} href={url} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex items-center gap-1 text-pine-3 hover:underline">
                            {l.replace(/^https?:\/\/(www\.)?/, "")} <ExternalLink className="size-3" />
                          </a>
                        );
                      })}
                    </p>
                  ) : null}
                  {m.message ? <p className="mt-2 max-w-3xl text-[14px] leading-relaxed whitespace-pre-line text-ink-2">{m.message}</p> : null}
                </div>
                <InlineAction
                  action={setMessageHandled}
                  fields={{ id: m.id, handled: m.handled ? "false" : "true" }}
                  label={m.handled ? "Reopen" : "Mark handled"}
                  variant={m.handled ? "ghost" : "secondary"}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
