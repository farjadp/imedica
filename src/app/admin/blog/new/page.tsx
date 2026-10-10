import Link from "next/link";

import { PageHeader } from "@/components/app/page-header";
import { PostEditor } from "@/components/blog-admin/post-editor";
import { CONTENT_ROLES, requireRolePage } from "@/server/auth/guards";
import { db } from "@/server/db";
import { env } from "@/server/env";

export const metadata = { title: "New post" };

export default async function NewPostPage() {
  const user = await requireRolePage(CONTENT_ROLES, "/admin/blog/new");
  const categories = await db.blogCategory.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }], select: { id: true, name: true } });
  return (
    <div className="space-y-6">
      <PageHeader title="New post" description={<Link href="/admin/blog" className="hover:underline">← All posts</Link>} />
      <PostEditor initial={{ authorTitle: user.role === "PHYSICIAN" ? "Physician" : "" }} categories={categories} siteUrl={env().APP_URL} />
    </div>
  );
}
