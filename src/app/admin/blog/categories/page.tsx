import Link from "next/link";

import { InlineAction } from "@/components/app/inline-action";
import { EmptyState, PageHeader, Panel } from "@/components/app/page-header";
import { CONTENT_ROLES, requireRolePage } from "@/server/auth/guards";
import { deleteCategory } from "@/server/blog/actions";
import { db } from "@/server/db";

import { CategoryForm } from "./category-form";

export const metadata = { title: "Blog categories" };

export default async function CategoriesPage({ searchParams }: { searchParams: Promise<{ edit?: string }> }) {
  const user = await requireRolePage(CONTENT_ROLES, "/admin/blog/categories");
  const { edit } = await searchParams;
  const categories = await db.blogCategory.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: { _count: { select: { posts: true } } },
  });
  const editing = categories.find((c) => c.id === edit);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Blog categories"
        description={
          <Link href="/admin/blog" className="hover:underline">
            ← All posts
          </Link>
        }
      />
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        {categories.length === 0 ? (
          <EmptyState title="No categories yet" body="Add the first one on the right. Posts can also stay uncategorised." />
        ) : (
          <div className="overflow-x-auto rounded-lg border border-rule bg-card">
            <table className="w-full min-w-[560px] text-left text-[14px]">
              <thead className="border-b border-rule text-[12px] text-ink-3">
                <tr>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 text-right font-medium">Posts</th>
                  <th className="px-4 py-3 text-right font-medium">Order</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-rule-2">
                {categories.map((c) => (
                  <tr key={c.id} className={c.id === edit ? "bg-pine-wash/50" : undefined}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-ink">{c.name}</p>
                      <p className="font-mono text-[12px] text-ink-3">/blog/category/{c.slug}</p>
                    </td>
                    <td className="tabular px-4 py-3 text-right text-ink-2">{c._count.posts}</td>
                    <td className="tabular px-4 py-3 text-right text-ink-3">{c.sortOrder}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Link href={`/admin/blog/categories?edit=${c.id}`} className="inline-flex h-8 items-center rounded-md px-2.5 text-[13px] font-medium text-pine hover:bg-paper-2">
                          Edit
                        </Link>
                        {user.role === "ADMIN" ? (
                          <InlineAction
                            action={deleteCategory}
                            fields={{ id: c.id }}
                            label="Delete"
                            confirmText={`Delete “${c.name}”? Its ${c._count.posts} post(s) become uncategorised.`}
                          />
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Panel title={editing ? `Edit “${editing.name}”` : "Add a category"} aside={editing ? <Link href="/admin/blog/categories" className="text-[13px] text-ink-3 hover:text-ink">Cancel</Link> : undefined}>
          <CategoryForm key={editing?.id ?? "new"} category={editing} />
        </Panel>
      </div>
    </div>
  );
}
