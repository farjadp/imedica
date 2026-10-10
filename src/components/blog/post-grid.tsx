import type { PostCard as Post } from "@/server/blog/service";

import { PostCard } from "./post-card";

export function PostGrid({ posts, featureFirst }: { posts: Post[]; featureFirst?: boolean }) {
  if (!posts.length) {
    return (
      <div className="rounded-2xl border border-dashed border-rule px-6 py-20 text-center">
        <p className="font-display text-[1.8rem] text-ink">Nothing here yet.</p>
        <p className="mt-2 text-[15px] text-ink-3">Try another search or category.</p>
      </div>
    );
  }
  return (
    <div className="grid gap-x-8 gap-y-16 md:grid-cols-2 lg:grid-cols-3">
      {posts.map((p, i) => (
        <PostCard key={p.id} post={p} featured={featureFirst && i === 0} />
      ))}
    </div>
  );
}
