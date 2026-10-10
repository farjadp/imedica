import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/app/page-header";
import { PostEditor } from "@/components/blog-admin/post-editor";
import { asFaq, asSources } from "@/lib/blog";
import { CONTENT_ROLES, requireRolePage } from "@/server/auth/guards";
import { db } from "@/server/db";
import { env } from "@/server/env";

export const metadata = { title: "Edit post" };

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireRolePage(CONTENT_ROLES, "/admin/blog");
  const { id } = await params;
  const [post, categories] = await Promise.all([
    db.blogPost.findUnique({ where: { id } }),
    db.blogCategory.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }], select: { id: true, name: true } }),
  ]);
  if (!post) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Edit post"
        description={
          <>
            <Link href="/admin/blog" className="hover:underline">
              ← All posts
            </Link>{" "}
            · by {post.authorName}
          </>
        }
      />
      <PostEditor
        siteUrl={env().APP_URL}
        categories={categories}
        canDelete={user.role === "ADMIN"}
        initial={{
          id: post.id,
          status: post.status,
          publishedAt: post.publishedAt?.toISOString() ?? null,
          title: post.title,
          slug: post.slug,
          excerpt: post.excerpt,
          body: post.body,
          keyTakeaway: post.keyTakeaway ?? "",
          faq: asFaq(post.faq),
          sources: asSources(post.sources),
          categoryId: post.categoryId ?? "",
          tags: post.tags,
          coverImageId: post.coverImageId ?? "",
          coverAlt: post.coverAlt ?? "",
          authorTitle: post.authorTitle ?? "",
          featured: post.featured,
          metaTitle: post.metaTitle ?? "",
          metaDescription: post.metaDescription ?? "",
          focusKeyword: post.focusKeyword ?? "",
          canonicalUrl: post.canonicalUrl ?? "",
          noindex: post.noindex,
        }}
      />
    </div>
  );
}
