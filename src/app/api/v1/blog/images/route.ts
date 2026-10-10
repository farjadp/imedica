import { route } from "@/server/api";
import { audit } from "@/server/audit";
import { CONTENT_ROLES, HttpError, requireRole } from "@/server/auth/guards";
import { MAX_IMAGE_BYTES, imageSize, sniffImage } from "@/server/blog/image";
import { db } from "@/server/db";

// POST /api/v1/blog/images — multipart, field "file". Staff only.
export const POST = route(async (req) => {
  const user = await requireRole(CONTENT_ROLES);
  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) throw new HttpError(422, "Choose an image to upload.");
  if (file.size > MAX_IMAGE_BYTES) throw new HttpError(413, "Images must be 3 MB or smaller.");

  const bytes = new Uint8Array(await file.arrayBuffer());
  const mime = sniffImage(bytes);
  if (!mime) throw new HttpError(415, "Upload a JPEG, PNG or WebP image.");
  const size = imageSize(bytes, mime);
  const alt = String(form.get("alt") ?? "").trim().slice(0, 200) || null;

  const image = await db.blogImage.create({
    data: { mime, bytes, size: bytes.length, width: size?.width, height: size?.height, alt },
    select: { id: true, width: true, height: true },
  });
  await audit(user, "blog.image_upload", { type: "BlogImage", id: image.id }, { bytes: bytes.length });
  return { ...image, url: `/blog-media/${image.id}` };
});
