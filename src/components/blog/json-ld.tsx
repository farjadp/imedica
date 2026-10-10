import { jsonLd } from "@/server/blog/seo";

export function JsonLd({ data }: { data: unknown }) {
  // Escaped by jsonLd(), so the payload can't close the script tag.
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(data) }} />;
}
