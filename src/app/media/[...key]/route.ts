import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { resolveLocalPath } from "@/lib/storage/local";

/**
 * Serves locally stored media in development (STORAGE_DRIVER=local).
 * In production with R2, media URLs point straight at the bucket / CDN.
 */

const TYPES: Record<string, string> = {
  ".avif": "image/avif",
  ".webp": "image/webp",
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".tiff": "image/tiff",
  ".svg": "image/svg+xml",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
};

export async function GET(request: Request, { params }: { params: Promise<{ key: string[] }> }) {
  const file = resolveLocalPath((await params).key.join("/"));
  if (!file) return new Response("Not found", { status: 404 });

  try {
    const info = await stat(file);
    const type = TYPES[path.extname(file).toLowerCase()] ?? "application/octet-stream";
    const headers: Record<string, string> = {
      "Content-Type": type,
      "Cache-Control": "public, max-age=31536000, immutable",
      "Accept-Ranges": "bytes",
      // Uploaded SVGs must never run scripts, even if opened directly.
      ...(type === "image/svg+xml" ? { "Content-Security-Policy": "script-src 'none'" } : {}),
    };

    // Safari refuses to play <video> without byte-range support.
    const range = request.headers.get("range")?.match(/bytes=(\d*)-(\d*)/);
    if (range) {
      const start = range[1] ? Number(range[1]) : 0;
      const end = range[2] ? Math.min(Number(range[2]), info.size - 1) : info.size - 1;
      const body = (await readFile(file)).subarray(start, end + 1);
      return new Response(body, {
        status: 206,
        headers: { ...headers, "Content-Range": `bytes ${start}-${end}/${info.size}`, "Content-Length": String(body.length) },
      });
    }

    return new Response(await readFile(file), { headers: { ...headers, "Content-Length": String(info.size) } });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
