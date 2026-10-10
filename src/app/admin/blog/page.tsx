import { ExternalLink, Plus, Tags } from "lucide-react";
import Link from "next/link";

import { InlineAction } from "@/components/app/inline-action";
import { EmptyState, PageHeader, StatusPill } from "@/components/app/page-header";
import { ButtonLink } from "@/components/ui/button";
import { formatDate, formatDateTime } from "@/lib/labels";
import { cn } from "@/lib/cn";
import type { PostStatus } from "@/generated/prisma/enums";
import { CONTENT_ROLES, requireRolePage } from "@/server/auth/guards";
import { deletePost } from "@/server/blog/actions";
import { db } from "@/server/db";

export const metadata = { title: "Blog" };

const FILTERS: { key: "ALL" | PostStatus; label: string }[] = [
  { key: "ALL", label: "All" },
  { key: "DRAFT", label: "Drafts" },
  { key: "REVIEW", label: "In review" },
  { key: "SCHEDULED", label: "Scheduled" },
  { key: "PUBLISHED", label: "Published" },
  { key: "ARCHIVED", label: "Archived" },
];

export default async function BlogDesk({ searchParams }: { searchParams: Promise<{ status?: string; q?: string }> }) {
  const user = await requireRolePage(CONTENT_ROLES, "/admin/blog");
  const sp = await searchParams;
  const status = FILTERS.some((f) => f.key === sp.status) ? (sp.status as (typeof FILTERS)[number]["key"]) : "ALL";
  const q = sp.q?.trim().slice(0, 80) ?? "";

  const [posts, grouped] = await Promise.all([
    db.blogPost.findMany({
      where: {
        ...(status === "ALL" ? {} : { status }),
        ...(q ? { title: { contains: q, mode: "insensitive" as const } } : {}),
      },
      select: { id: true, slug: true, title: true, status: true, publishedAt: true, updatedAt: true, authorName: true, featured: true, category: { select: { name: true } } },
      orderBy: { updatedAt: "desc" },
      take: 200,
    }),
    db.blogPost.groupBy({ by: ["status"], _count: true }),
  ]);
  const counts = Object.fromEntries(grouped.map((g) => [g.status, g._count])) as Partial<Record<PostStatus, number>>;
  const total = grouped.reduce((s, g) => s + g._count, 0);
  const now = new Date();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Blog"
        description="Field Notes on the public site. Drafts stay private; scheduled posts go live on their own at the set time."
        actions={
          <>
            <ButtonLink href="/admin/blog/categories" variant="secondary">
              <Tags className="size-4" /> Categories
            </ButtonLink>
            <ButtonLink href="/admin/blog/new">
              <Plus className="size-4" /> New post
            </ButtonLink>
          </>
        }
      />

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <nav className="flex flex-wrap gap-1.5" aria-label="Filter by status">
          {FILTERS.map((f) => {
            const n = f.key === "ALL" ? total : (counts[f.key] ?? 0);
            return (
              <Link
                key={f.key}
                href={f.key === "ALL" ? "/admin/blog" : `/admin/blog?status=${f.key}`}
                className={cn(
                  "inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[13px]",
                  status === f.key ? "bg-ink text-paper" : "bg-card text-ink-2 ring-1 ring-rule hover:text-ink",
                )}
              >
                {f.label} <span className="tabular opacity-60">{n}</span>
              </Link>
            );
          })}
        </nav>
        <form className="md:w-72">
          {status !== "ALL" ? <input type="hidden" name="status" value={status} /> : null}
          <input
            name="q"
            type="search"
            defaultValue={q}
            placeholder="Search titles"
            aria-label="Search titles"
            className="h-9 w-full rounded-md border border-rule bg-card px-3 text-[14px] focus:border-pine-3 focus:outline-none"
          />
        </form>
      </div>

      {posts.length === 0 ? (
        <EmptyState
          title={q || status !== "ALL" ? "No posts match" : "No posts yet"}
          body={q || status !== "ALL" ? "Try another filter." : "Write the first Field Note. It stays a private draft until you publish it."}
          action={<ButtonLink href="/admin/blog/new">New post</ButtonLink>}
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-rule bg-card">
          <table className="w-full min-w-[760px] text-left text-[14px]">
            <thead className="border-b border-rule text-[12px] text-ink-3">
              <tr>
                <th className="px-4 py-3 font-medium">Post</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Goes live</th>
                <th className="px-4 py-3 font-medium">Updated</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-rule-2">
              {posts.map((p) => {
                const live = (p.status === "PUBLISHED" || p.status === "SCHEDULED") && p.publishedAt && p.publishedAt <= now;
                return (
                  <tr key={p.id}>
                    <td className="max-w-[420px] px-4 py-3">
                      <Link href={`/admin/blog/${p.id}`} className="font-medium text-ink hover:underline">
                        {p.title}
                      </Link>
                      <p className="mt-0.5 truncate text-[12px] text-ink-3">
                        {p.category?.name ?? "Uncategorised"} · {p.authorName}
                        {p.featured ? " · featured" : ""}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <StatusPill status={p.status === "SCHEDULED" && live ? "PUBLISHED" : p.status} />
                    </td>
                    <td className="px-4 py-3 text-ink-2">
                      {p.publishedAt ? (p.status === "SCHEDULED" && !live ? formatDateTime(p.publishedAt) : formatDate(p.publishedAt)) : "—"}
                    </td>
                    <td className="px-4 py-3 text-ink-3">{formatDate(p.updatedAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {live ? (
                          <a href={`/blog/${p.slug}`} target="_blank" rel="noopener" className="inline-flex h-8 items-center gap-1 rounded-md px-2.5 text-[13px] text-ink-2 hover:bg-paper-2" aria-label={`View ${p.title} on the site`}>
                            View <ExternalLink className="size-3" />
                          </a>
                        ) : (
                          <Link href={`/blog/preview/${p.id}`} className="inline-flex h-8 items-center rounded-md px-2.5 text-[13px] text-ink-2 hover:bg-paper-2">
                            Preview
                          </Link>
                        )}
                        <Link href={`/admin/blog/${p.id}`} className="inline-flex h-8 items-center rounded-md px-2.5 text-[13px] font-medium text-pine hover:bg-paper-2">
                          Edit
                        </Link>
                        {user.role === "ADMIN" ? (
                          <InlineAction action={deletePost} fields={{ id: p.id }} label="Delete" variant="ghost" confirmText={`Delete “${p.title}” for good? Archive keeps it instead.`} />
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
