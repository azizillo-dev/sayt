import {
  IMMUTABLE_CACHE,
  isImageMime,
  isVideoMime,
  MAX_IMAGE_BYTES,
  MAX_PDF_BYTES,
  MAX_VIDEO_SOURCE_BYTES,
  MAX_VIDEO_SECONDS,
} from "@/lib/media/limits";
import type { MediaAsset } from "@/lib/media/types";

export type UploadKind = "image" | "video" | "any";

interface VideoInfo {
  width: number;
  height: number;
  duration: number;
}

/** Reads a video's size and length locally, before spending time uploading it. */
function probeVideo(file: File): Promise<VideoInfo> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    video.onloadedmetadata = () => {
      resolve({ width: video.videoWidth, height: video.videoHeight, duration: video.duration });
      URL.revokeObjectURL(url);
    };
    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Videoni o'qib bo'lmadi — MP4 (H.264) yoki WebM formatida eksport qiling"));
    };
    video.src = url;
  });
}

/** Client-side checks with friendly messages; the server re-validates everything. */
export async function validateFile(file: File, kind: UploadKind): Promise<VideoInfo | null> {
  const image = isImageMime(file.type);
  const video = isVideoMime(file.type);

  if (kind === "image" && !image) throw new Error(`"${file.name}" rasm emas. JPG, PNG, WebP, AVIF, GIF, TIFF yoki SVG yuklang.`);
  if (kind === "video" && !video) throw new Error(`"${file.name}" video emas. MP4 yoki WebM yuklang.`);
  if (!image && !video) throw new Error(`"${file.name}" formati qo'llab-quvvatlanmaydi`);

  if (image && file.size > MAX_IMAGE_BYTES) throw new Error(`Rasm ${MAX_IMAGE_BYTES / 1024 / 1024} MB dan katta`);
  if (video) {
    if (file.size > MAX_VIDEO_SOURCE_BYTES) throw new Error(`Video ${MAX_VIDEO_SOURCE_BYTES / 1024 / 1024} MB dan katta`);
    const info = await probeVideo(file);
    if (info.duration > MAX_VIDEO_SECONDS + 0.5) {
      throw new Error(
        `Video ${Math.round(info.duration)} soniya. Saytga ${MAX_VIDEO_SECONDS} soniyagacha animatsiyalar yuklanadi — uzunroq videoni YouTube'ga joylab, "YouTube" blokini ishlating.`,
      );
    }
    return info;
  }
  return null;
}

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => null)) as (T & { error?: string }) | null;
  if (!res.ok) throw new Error(data?.error ?? `Yuklashda xatolik (${res.status})`);
  return data as T;
}

/** The only part worth a progress bar; fetch cannot report upload progress, XHR can. */
function putFile(url: string, file: File, onProgress?: (ratio: number) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", file.type);
    // Signed into the URL, so it must match; the bucket stores and serves it.
    xhr.setRequestHeader("Cache-Control", IMMUTABLE_CACHE);
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress?.(e.loaded / e.total);
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`Faylni saqlab bo'lmadi (${xhr.status})`)));
    xhr.onerror = () => reject(new Error("Tarmoq xatosi — internet aloqasini tekshiring"));
    xhr.send(file);
  });
}

/**
 * Uploads in three steps: ask where to put the file, put it there, then ask
 * the server to process it. The bytes go straight to storage, so the file is
 * not limited by what the host accepts in a request body.
 */
export async function uploadFile(
  file: File,
  {
    kind = "any",
    lossless = false,
    trim = false,
    onProgress,
  }: { kind?: UploadKind; lossless?: boolean; /** Cut empty margins (logos). */ trim?: boolean; onProgress?: (ratio: number) => void } = {},
): Promise<MediaAsset> {
  const videoInfo = await validateFile(file, kind);
  if (videoInfo) return uploadVideo(file, videoInfo.duration, onProgress);

  const ticket = await store(file, undefined, onProgress);
  onProgress?.(1);
  return postJson<MediaAsset>("/api/admin/upload/complete", { ticket, lossless, trim });
}

/** Steps one and two: reserve a place, put the bytes there. Returns the ticket. */
async function store(file: File, duration: number | undefined, onProgress?: (ratio: number) => void): Promise<string> {
  const { uploadUrl, ticket } = await postJson<{ uploadUrl: string; ticket: string }>("/api/admin/upload", {
    fileName: file.name,
    mimeType: file.type,
    size: file.size,
    duration,
  });
  await putFile(uploadUrl, file, onProgress);
  return ticket;
}

/**
 * Videos are re-encoded for the web first (see transcode.ts): the first half
 * of the progress bar is that, the second half the upload of both files.
 */
async function uploadVideo(file: File, duration: number, onProgress?: (ratio: number) => void): Promise<MediaAsset> {
  const { transcodeVideo } = await import("./transcode");
  const out = await transcodeVideo(file, (p) => onProgress?.(p * 0.5));
  const total = out.video.size + out.preview.size;
  const ticket = await store(out.video, duration, (p) => onProgress?.(0.5 + ((p * out.video.size) / total) * 0.5));
  const previewTicket = await store(out.preview, Math.min(duration, 8), (p) =>
    onProgress?.(0.5 + ((out.video.size + p * out.preview.size) / total) * 0.5),
  );
  onProgress?.(1);
  return postJson<MediaAsset>("/api/admin/upload/complete", { ticket, previewTicket, width: out.width, height: out.height });
}

export async function uploadPdf(file: File, onProgress?: (ratio: number) => void): Promise<{ key: string; url: string; fileName: string }> {
  if (file.type !== "application/pdf" || !file.name.toLowerCase().endsWith(".pdf")) throw new Error("PDF faylni tanlang");
  if (file.size > MAX_PDF_BYTES) throw new Error(`PDF ${MAX_PDF_BYTES / 1024 / 1024} MB dan katta`);
  const { uploadUrl, ticket } = await postJson<{ uploadUrl: string; ticket: string }>("/api/admin/upload", {
    fileName: file.name,
    mimeType: file.type,
    size: file.size,
  });
  await putFile(uploadUrl, file, onProgress);
  onProgress?.(1);
  return postJson<{ key: string; url: string; fileName: string }>("/api/admin/upload/complete", { ticket });
}
