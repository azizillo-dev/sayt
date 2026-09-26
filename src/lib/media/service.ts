import "server-only";
import { randomUUID } from "node:crypto";
import { inArray } from "drizzle-orm";
import { db, schema } from "@/db";
import type { Media } from "@/db/schema";
import { storage } from "@/lib/storage";
import { MAX_IMAGE_BYTES, MAX_VIDEO_BYTES } from "./limits";
import { isSafeSvg, processImage, svgDimensions } from "./process-image";
import type { MediaAsset, MediaMap, MediaVariant } from "./types";

const EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
  "image/gif": "gif",
  "image/tiff": "tiff",
  "image/svg+xml": "svg",
  "video/mp4": "mp4",
  "video/webm": "webm",
};

export class MediaError extends Error {}

/** Where the browser will store an original of this type. */
export function originalKey(mimeType: string, kind: "image" | "video"): string {
  return `uploads/${randomUUID()}/${kind === "video" ? "video" : "original"}.${EXTENSIONS[mimeType]}`;
}

interface Ingest {
  /** Key the browser already uploaded the original to. */
  key: string;
  mimeType: string;
  fileName: string;
}

/**
 * Turns an original the browser has already stored into a media row: renders
 * every size and format, then records it. The original is read back from
 * storage, so a 40 MB export never travels through a request body.
 */
export async function ingestImage({ key, mimeType, fileName, lossless }: Ingest & { lossless: boolean }) {
  const body = await readOriginal(key, MAX_IMAGE_BYTES);
  const id = keyId(key);
  const prefix = `uploads/${id}`;

  let row: typeof schema.media.$inferInsert;

  if (mimeType === "image/svg+xml") {
    if (!isSafeSvg(body)) {
      await storage.delete([key]);
      throw new MediaError("SVG faylda ruxsat etilmagan kod bor");
    }
    const { width, height } = await svgDimensions(body);
    row = { id, kind: "image", originalKey: key, mimeType, fileName, sizeBytes: body.length, width, height };
  } else {
    const processed = await processImage(body, { lossless }).catch(async () => {
      await storage.delete([key]);
      throw new MediaError("Rasmni o'qib bo'lmadi — fayl buzilgan yoki format qo'llab-quvvatlanmaydi");
    });

    const variants: MediaVariant[] = processed.variants.map(({ body: _b, ...v }) => ({
      ...v,
      key: `${prefix}/${v.width}.${v.format}`,
    }));

    await Promise.all(processed.variants.map((v, i) => storage.put(variants[i]!.key, v.body, `image/${v.format}`)));

    row = {
      id,
      kind: "image",
      originalKey: key,
      mimeType,
      fileName,
      sizeBytes: body.length,
      width: processed.width,
      height: processed.height,
      variants,
      placeholder: processed.placeholder,
      dominantColor: processed.dominantColor,
    };
  }

  const [saved] = await db.insert(schema.media).values(row).returning();
  return toAsset(saved!);
}

/**
 * Short videos are stored untouched — the browser reports their size and
 * duration before upload (see the admin uploader), and the server re-checks
 * the byte size. Transcoding would need ffmpeg, which is not worth it for
 * 10-second loops that designers already export for the web.
 */
export async function ingestVideo({ key, mimeType, fileName, width, height }: Ingest & { width: number; height: number }) {
  const body = await readOriginal(key, MAX_VIDEO_BYTES);

  const [saved] = await db
    .insert(schema.media)
    .values({
      id: keyId(key),
      kind: "video",
      originalKey: key,
      mimeType,
      fileName,
      sizeBytes: body.length,
      width,
      height,
    })
    .returning();
  return toAsset(saved!);
}

/** `uploads/<uuid>/original.jpg` → `<uuid>`; the row and its files share an id. */
function keyId(key: string): string {
  return key.split("/")[1]!;
}

/**
 * The declared size was signed into the upload URL, but only the bytes that
 * actually landed can be trusted — so the limit is enforced here, and an
 * oversized original is removed rather than left paid-for in the bucket.
 */
async function readOriginal(key: string, limit: number): Promise<Buffer> {
  const body = await storage.get(key).catch(() => {
    throw new MediaError("Yuklangan fayl topilmadi — qaytadan urinib ko'ring");
  });
  if (body.length > limit) {
    await storage.delete([key]);
    throw new MediaError(`Fayl ${Math.round(limit / 1024 / 1024)} MB dan katta`);
  }
  return body;
}

export function toAsset(row: Media): MediaAsset {
  const byFormat = (format: "avif" | "webp") =>
    row.variants
      .filter((v) => v.format === format)
      .sort((a, b) => a.width - b.width)
      .map((v) => `${storage.publicUrl(v.key)} ${v.width}w`)
      .join(", ");

  const largestWebp = row.variants.filter((v) => v.format === "webp").sort((a, b) => b.width - a.width)[0];

  return {
    id: row.id,
    kind: row.kind,
    url: storage.publicUrl(largestWebp?.key ?? row.originalKey),
    mimeType: row.mimeType,
    width: row.width,
    height: row.height,
    alt: row.alt,
    placeholder: row.placeholder,
    dominantColor: row.dominantColor,
    sources: row.variants.length
      ? (["avif", "webp"] as const).map((format) => ({ format, srcSet: byFormat(format) })).filter((s) => s.srcSet)
      : [],
  };
}

/** Loads many media rows in one query, keyed by id. */
export async function getMediaMap(ids: (string | null | undefined)[]): Promise<MediaMap> {
  const unique = [...new Set(ids.filter((id): id is string => Boolean(id)))];
  if (unique.length === 0) return {};
  const rows = await db.select().from(schema.media).where(inArray(schema.media.id, unique));
  return Object.fromEntries(rows.map((row) => [row.id, toAsset(row)]));
}
