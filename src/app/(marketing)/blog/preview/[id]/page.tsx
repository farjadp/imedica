import Link from "next/link";
import { notFound } from "next/navigation";

import { Article } from "@/components/blog/article";
import { CONTENT_ROLES, requireRolePage } from "@/server/auth/guards";
import { absolute } from "@/server/blog/seo";
import { db } from "@/server/db";

export const metadata = { title: "Preview", robots: { index: false, follow: false } };

/** Staff-only: any post, in any status, exactly as it will look live. */
export default async function PreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireRolePage(CONTENT_ROLES, `/blog/preview/${id}`);
  const post = await db.blogPost.findUnique({ where: { id }, include: { category: { select: { slug: true, name: true } } } });
  if (!post) notFound();

  return (
    <Article
      post={post}
      url={absolute(`/blog/${post.slug}`)}
      banner={
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3 rounded-full border border-[#ffd27a]/40 bg-[#ffd27a]/10 py-2 pr-2 pl-5 text-[13px] text-[#ffd27a]">
          <span>Preview · {post.status.toLowerCase()} · only staff can see this</span>
          <Link href={`/admin/blog/${post.id}`} className="rounded-full bg-[#ffd27a] px-4 py-1.5 font-medium text-[#06110e] hover:bg-white">
            Back to editor
          </Link>
        </div>
      }
    />
  );
}
