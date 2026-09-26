import { getAdmin } from "@/lib/auth/session";
import {
  isImageMime,
  isVideoMime,
  MAX_IMAGE_BYTES,
  MAX_VIDEO_BYTES,
  MAX_VIDEO_SECONDS,
} from "@/lib/media/limits";
import { originalKey } from "@/lib/media/service";
import { signTicket } from "@/lib/media/ticket";
import { storage } from "@/lib/storage";

/**
 * Step one of an upload: agree on where the file goes.
 *
 * The browser describes the file, gets back a URL to PUT it to and a signed
 * ticket, then calls `/complete` to have it processed. See `ticket.ts`.
 */

const mb = (bytes: number) => Math.round(bytes / 1024 / 1024);

function error(message: string, status = 400) {
  return Response.json({ error: message }, { status });
}

export async function POST(request: Request) {
  if (!(await getAdmin())) return error("Avtorizatsiya talab qilinadi", 401);

  const body = (await request.json().catch(() => null)) as {
    fileName?: unknown;
    mimeType?: unknown;
    size?: unknown;
    duration?: unknown;
  } | null;

  const mimeType = typeof body?.mimeType === "string" ? body.mimeType : "";
  const size = typeof body?.size === "number" ? body.size : -1;
  const fileName = (typeof body?.fileName === "string" ? body.fileName : "fayl").slice(0, 200);

  const image = isImageMime(mimeType);
  const video = isVideoMime(mimeType);
  if (!image && !video) {
    return error("Bu format qo'llab-quvvatlanmaydi. Rasm: JPG, PNG, WebP, AVIF, GIF, TIFF, SVG. Video: MP4, WebM.");
  }

  const limit = image ? MAX_IMAGE_BYTES : MAX_VIDEO_BYTES;
  if (!(size > 0)) return error("Fayl bo'sh");
  if (size > limit) return error(`${image ? "Rasm" : "Video"} hajmi ${mb(limit)} MB dan oshmasin`);

  if (video) {
    const duration = typeof body?.duration === "number" ? body.duration : 0;
    if (!(duration > 0) || duration > MAX_VIDEO_SECONDS + 0.5) {
      return error(`Video ${MAX_VIDEO_SECONDS} soniyadan oshmasin — uzun videolarni YouTube orqali qo'shing`);
    }
  }

  const key = originalKey(mimeType, image ? "image" : "video");

  return Response.json({
    uploadUrl: await storage.uploadUrl(key, mimeType),
    ticket: await signTicket({ key, mimeType, fileName }),
  });
}
