import { getAdmin } from "@/lib/auth/session";
import { isImageMime } from "@/lib/media/limits";
import { ingestImage, ingestPdf, ingestVideo, MediaError } from "@/lib/media/service";
import { readTicket } from "@/lib/media/ticket";

/**
 * Step two of an upload: the original is in storage, turn it into media.
 *
 * Every size and format is rendered here, which is the slow part — a large
 * export can take a few seconds per variant.
 */
export const maxDuration = 60;

function error(message: string, status = 400) {
  return Response.json({ error: message }, { status });
}

export async function POST(request: Request) {
  if (!(await getAdmin())) return error("Avtorizatsiya talab qilinadi", 401);

  const body = (await request.json().catch(() => null)) as {
    ticket?: unknown;
    previewTicket?: unknown;
    lossless?: unknown;
    width?: unknown;
    height?: unknown;
  } | null;

  const ticket = await readTicket(body?.ticket);
  if (!ticket) return error("Yuklash muddati tugadi — qaytadan urinib ko'ring", 400);

  try {
    if (isImageMime(ticket.mimeType)) {
      return Response.json(await ingestImage({ ...ticket, lossless: body?.lossless === true }));
    }
    if (ticket.mimeType === "application/pdf") {
      return Response.json(await ingestPdf(ticket));
    }

    // The browser measured these before uploading; without them the player
    // cannot reserve space and the page would jump as the video loads.
    const width = Math.round(Number(body?.width));
    const height = Math.round(Number(body?.height));
    if (!(width > 0 && height > 0)) return error("Video o'lchamini aniqlab bo'lmadi");
    // Optional: uploads from before browser transcoding have no preview.
    const preview = body?.previewTicket ? await readTicket(body.previewTicket) : null;
    if (body?.previewTicket && !preview) return error("Yuklash muddati tugadi — qaytadan urinib ko'ring", 400);
    return Response.json(await ingestVideo({ ...ticket, width, height, previewKey: preview?.key ?? null }));
  } catch (e) {
    if (e instanceof MediaError) return error(e.message);
    console.error("[upload]", e);
    return error("Yuklashda xatolik yuz berdi", 500);
  }
}
