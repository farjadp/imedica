import Image from "next/image";
import Link from "next/link";

import { EcgTrace } from "@/components/clinical/ecg-trace";
import { formatPostDate } from "@/lib/blog";
import { cn } from "@/lib/cn";
import type { PostCard as Post } from "@/server/blog/service";

/** A cover, or a monitor-strip stand-in when the post has none. */
export function Cover({ post, sizes, priority, className }: { post: Pick<Post, "coverImageId" | "coverAlt" | "title">; sizes: string; priority?: boolean; className?: string }) {
  return (
    <div className={cn("relative overflow-hidden bg-[#0b1714]", className)}>
      {post.coverImageId ? (
        <Image
          src={`/blog-media/${post.coverImageId}`}
          alt={post.coverAlt ?? ""}
          fill
          sizes={sizes}
          priority={priority}
          className="object-cover transition-transform duration-700 ease-[var(--ease-out-expo)] group-hover:scale-[1.03]"
        />
      ) : (
        <div className="absolute inset-0 flex items-center bg-[radial-gradient(70%_70%_at_70%_30%,rgb(42_107_88/0.35),transparent_70%)]" aria-hidden>
          <EcgTrace rhythm="sinus" height={70} stroke="rgb(159 240 196 / 0.6)" className="w-full" />
        </div>
      )}
    </div>
  );
}

export function PostCard({ post, featured = false }: { post: Post; featured?: boolean }) {
  return (
    <article className={cn("group relative flex flex-col", featured && "md:col-span-2 md:grid md:grid-cols-[1.25fr_1fr] md:items-center md:gap-10")}>
      <Cover
        post={post}
        sizes={featured ? "(min-width: 768px) 60vw, 100vw" : "(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"}
        priority={featured}
        className={cn("aspect-[16/10] rounded-2xl", featured && "md:aspect-[4/3]")}
      />
      <div className={cn("mt-5 flex flex-1 flex-col", featured && "md:mt-0")}>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11px] tracking-[0.12em] text-ink-3 uppercase">
          {post.category ? <span className="text-signal">{post.category.name}</span> : null}
          {post.publishedAt ? <time dateTime={post.publishedAt.toISOString()}>{formatPostDate(post.publishedAt)}</time> : null}
          <span>{post.readingMinutes} min read</span>
        </div>
        <h3
          className={cn(
            "mt-3 font-display leading-[1.08] font-medium tracking-[-0.025em] text-ink",
            featured ? "text-[clamp(1.9rem,3.4vw,3rem)]" : "text-[1.6rem]",
          )}
        >
          <Link href={`/blog/${post.slug}`} className="after:absolute after:inset-0 hover:text-pine">
            {post.title}
          </Link>
        </h3>
        <p className={cn("mt-3 text-[16px] leading-relaxed text-ink-2", featured ? "line-clamp-4 md:text-[17px]" : "line-clamp-3")}>{post.excerpt}</p>
        {featured ? <p className="mt-5 text-[14px] text-ink-3">By {post.authorName}</p> : null}
      </div>
    </article>
  );
}
