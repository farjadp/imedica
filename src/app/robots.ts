import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { connection } from "next/server";

import { indexable } from "@/lib/indexing";

export default async function robots(): Promise<MetadataRoute.Robots> {
  // Read at request time: APP_URL may only exist at runtime, not at build.
  await connection();
  const base = process.env.APP_URL ?? "http://localhost:3000";
  // Staging and local copies must never compete with the real site in search.
  const h = await headers();
  const host = h.get("x-forwarded-host")?.split(",")[0].trim() ?? h.get("host");
  if (!indexable(process.env.APP_URL, host)) return { rules: [{ userAgent: "*", disallow: "/" }] };
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/app", "/run", "/api", "/invite", "/reset-password", "/blog/preview"] }],
    sitemap: new URL("/sitemap.xml", base).toString(),
  };
}
