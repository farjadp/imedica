import type { MetadataRoute } from "next";
import { connection } from "next/server";

import { absolute } from "@/server/blog/seo";
import { getCategoriesWithCounts, listLiveForFeeds } from "@/server/blog/service";

const pages: [string, MetadataRoute.Sitemap[number]["changeFrequency"], number][] = [
  ["/", "weekly", 1],
  ["/how-it-works", "monthly", 0.8],
  ["/for-services", "monthly", 0.8],
  ["/security", "monthly", 0.8],
  ["/about", "monthly", 0.6],
  ["/demo", "yearly", 0.6],
  ["/blog", "daily", 0.7],
  ["/legal/privacy", "yearly", 0.2],
  ["/legal/terms", "yearly", 0.2],
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await connection();
  const [posts, categories] = await Promise.all([listLiveForFeeds(), getCategoriesWithCounts()]);
  return [
    ...pages.map(([path, changeFrequency, priority]) => ({ url: absolute(path), changeFrequency, priority })),
    ...categories.filter((c) => c.count > 0).map((c) => ({ url: absolute(`/blog/category/${c.slug}`), changeFrequency: "daily" as const, priority: 0.5 })),
    ...posts.map((p) => ({ url: absolute(`/blog/${p.slug}`), lastModified: p.updatedAt, changeFrequency: "weekly" as const, priority: 0.7 })),
  ];
}
