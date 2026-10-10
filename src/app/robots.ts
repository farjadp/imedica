import type { MetadataRoute } from "next";
import { connection } from "next/server";

export default async function robots(): Promise<MetadataRoute.Robots> {
  // Read at request time: APP_URL may only exist at runtime, not at build.
  await connection();
  const base = process.env.APP_URL ?? "http://localhost:3000";
  // Staging and local copies must never compete with the real site in search.
  if (!/^https:\/\/(www\.)?imedica\.ca/.test(base)) return { rules: [{ userAgent: "*", disallow: "/" }] };
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/app", "/run", "/api", "/invite", "/reset-password", "/blog/preview"] }],
    sitemap: new URL("/sitemap.xml", base).toString(),
  };
}
