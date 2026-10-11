import Link from "next/link";

import { InlineAction } from "@/components/app/inline-action";
import { PageHeader, StatusPill } from "@/components/app/page-header";
import { formatDate } from "@/lib/labels";
import { cn } from "@/lib/cn";
import { requireRolePage } from "@/server/auth/guards";
import { importCalendar, publishCalendar } from "@/server/blog/actions";
import { CALENDAR, getCalendar } from "@/server/blog/calendar";

export const metadata = { title: "Editorial calendar" };

const monthLabel = (m: string) => new Date(`${m}-15T12:00:00`).toLocaleDateString("en-CA", { month: "short", year: "numeric" });

export default async function CalendarPage() {
  const user = await requireRolePage(["PHYSICIAN", "ADMIN"], "/admin/blog/calendar");
  const rows = await getCalendar();
  const waiting = rows.filter((r) => r.file?.article && !r.post).length;
  const unpublished = rows.filter((r) => r.file?.article && r.post?.status !== "PUBLISHED").length;
  const now = new Date();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Editorial calendar"
        description={
          <>
            One Field Note a month, {monthLabel(CALENDAR.start)} to {monthLabel(CALENDAR.end)}. Articles are drafted in{" "}
            <code className="rounded bg-paper-2 px-1 text-[13px]">content/blog</code> and imported as <strong>In review</strong>: a
            physician checks each one in the editor, then it&apos;s published or scheduled. <strong>Publish all</strong> puts every
            remaining article live at once, dated today, each marked as awaiting physician review until that line is edited out.{" "}
            <Link href="/admin/blog" className="underline">
              ← All posts
            </Link>
          </>
        }
        actions={
          user.role === "ADMIN" && (waiting || unpublished) ? (
            <>
              {waiting ? <InlineAction action={importCalendar} fields={{}} label={`Import ${waiting} draft${waiting === 1 ? "" : "s"}`} variant="secondary" /> : null}
              {unpublished ? (
                <InlineAction
                  action={publishCalendar}
                  fields={{}}
                  label={`Publish all ${unpublished}`}
                  variant="primary"
                  confirmText={`Publish ${unpublished} article${unpublished === 1 ? "" : "s"} now, dated today? Each one says physician review is pending until you edit that line out.`}
                />
              ) : null}
            </>
          ) : undefined
        }
      />

      <div className="overflow-x-auto rounded-lg border border-rule bg-card">
        <table className="w-full min-w-[860px] text-left text-[14px]">
          <thead className="border-b border-rule text-[12px] text-ink-3">
            <tr>
              <th className="px-4 py-3 font-medium">Month</th>
              <th className="px-4 py-3 font-medium">Article</th>
              <th className="px-4 py-3 font-medium">Focus keyword</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-rule-2">
            {rows.map(({ key, month, file, post }) => {
              const live = post && (post.status === "PUBLISHED" || post.status === "SCHEDULED") && post.publishedAt && post.publishedAt <= now;
              return (
                <tr key={key} className={cn(!file && !post && "bg-tag-yellow-wash/40")}>
                  <td className="tabular px-4 py-3 font-mono text-[13px] whitespace-nowrap text-ink-2">{monthLabel(month)}</td>
                  <td className="max-w-[420px] px-4 py-3">
                    {post ? (
                      <Link href={`/admin/blog/${post.id}`} className="font-medium text-ink hover:underline">
                        {post.title}
                      </Link>
                    ) : file?.article ? (
                      <span className="text-ink-2">{file.article.title}</span>
                    ) : file?.error ? (
                      <span className="text-tag-red">
                        {file.file}: {file.error}
                      </span>
                    ) : (
                      <span className="text-ink-3">Nothing planned yet</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-ink-3">{file?.article?.focusKeyword ?? "—"}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {post ? (
                      <span className="inline-flex items-center gap-2">
                        <StatusPill status={live ? "PUBLISHED" : post.status} />
                        {post.publishedAt ? <span className="text-[12px] text-ink-3">{formatDate(post.publishedAt)}</span> : null}
                      </span>
                    ) : file?.article ? (
                      <span className="text-[13px] text-ink-3">Not imported</span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {post ? (
                      <Link href={live ? `/blog/${post.slug}` : `/blog/preview/${post.id}`} className="text-[13px] text-pine hover:underline">
                        {live ? "View" : "Preview"}
                      </Link>
                    ) : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
