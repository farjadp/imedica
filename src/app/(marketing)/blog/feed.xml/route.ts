import { connection } from "next/server";

import { absolute, BLOG_NAME } from "@/server/blog/seo";
import { listLiveForFeeds } from "@/server/blog/service";

const x = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// GET /blog/feed.xml — RSS 2.0, the 50 newest posts.
export async function GET() {
  await connection();
  const posts = await listLiveForFeeds(50);
  const items = posts
    .map((p) => {
      const link = absolute(`/blog/${p.slug}`);
      return `    <item>
      <title>${x(p.title)}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <description>${x(p.excerpt)}</description>
      <dc:creator>${x(p.authorName)}</dc:creator>${p.category ? `\n      <category>${x(p.category.name)}</category>` : ""}
      <pubDate>${(p.publishedAt ?? p.updatedAt).toUTCString()}</pubDate>
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>${BLOG_NAME}</title>
    <link>${absolute("/blog")}</link>
    <description>Clinical decision-making for paramedics and EMS training leads.</description>
    <language>en-ca</language>
    <atom:link href="${absolute("/blog/feed.xml")}" rel="self" type="application/rss+xml" />${posts[0] ? `\n    <lastBuildDate>${(posts[0].publishedAt ?? posts[0].updatedAt).toUTCString()}</lastBuildDate>` : ""}
${items}
  </channel>
</rss>`;
  return new Response(xml, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8", "Cache-Control": "public, max-age=600, s-maxage=600" },
  });
}
