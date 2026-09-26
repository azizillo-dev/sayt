import { getAdmin } from "@/lib/auth/session";
import { MAX_IMAGE_BYTES, MAX_VIDEO_BYTES } from "@/lib/media/limits";
import { storage } from "@/lib/storage";

/**
 * Stands in for a presigned URL when files are kept on the local disk
 * (development). With `STORAGE_DRIVER=r2` the browser PUTs straight to the
 * bucket and this route is never called.
 */
export const maxDuration = 60;

export async function PUT(request: Request) {
  if (!(await getAdmin())) return Response.json({ error: "Avtorizatsiya talab qilinadi" }, { status: 401 });

  const key = new URL(request.url).searchParams.get("key") ?? "";
  // The driver's own path check rejects traversal; this keeps writes inside
  // the folder uploads are supposed to land in.
  if (!/^uploads\/[0-9a-f-]{36}\/[\w.-]+$/.test(key)) {
    return Response.json({ error: "Noto'g'ri manzil" }, { status: 400 });
  }

  const body = Buffer.from(await request.arrayBuffer());
  if (body.length > Math.max(MAX_IMAGE_BYTES, MAX_VIDEO_BYTES)) {
    return Response.json({ error: "Fayl juda katta" }, { status: 413 });
  }

  await storage.put(key, body, request.headers.get("content-type") ?? "application/octet-stream");
  return new Response(null, { status: 204 });
}
