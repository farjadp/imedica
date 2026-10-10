import { db } from "@/server/db";

// GET /blog-media/:id — uploaded blog images. Ids are unguessable and an image
// never changes once stored, so it's cached for a year.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[a-z0-9]{20,32}$/.test(id)) return new Response("Not found", { status: 404 });
  const image = await db.blogImage.findUnique({ where: { id }, select: { mime: true, bytes: true } });
  if (!image) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(image.bytes), {
    headers: {
      "Content-Type": image.mime,
      "Cache-Control": "public, max-age=31536000, immutable",
      "Content-Security-Policy": "default-src 'none'",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
