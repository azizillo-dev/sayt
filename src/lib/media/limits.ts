/** Shared between the upload endpoint and the admin uploader UI. */

export const IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
  "image/tiff",
  "image/svg+xml",
] as const;

export const VIDEO_MIME_TYPES = ["video/mp4", "video/webm"] as const;

/**
 * Every size and format of an image is rendered in one serverless call, which
 * the host caps at 60 seconds; 40 MB is what reliably finishes inside that.
 */
export const MAX_IMAGE_BYTES = 40 * 1024 * 1024;
export const MAX_VIDEO_BYTES = 40 * 1024 * 1024;
/**
 * The file the designer picks may be far larger: it is re-encoded in the
 * browser first, and only the result — checked against MAX_VIDEO_BYTES — is stored.
 */
export const MAX_VIDEO_SOURCE_BYTES = 500 * 1024 * 1024;
export const MAX_PDF_BYTES = 40 * 1024 * 1024;
/** Portrait reels can run longer than the short loops used in project pages. */
export const MAX_VIDEO_SECONDS = 60;

/**
 * Every stored file lives at a key unique to its upload, so it never changes.
 * The browser sends this with its direct upload; the bucket keeps it and
 * serves it back, so repeat visitors never re-download media.
 */
export const IMMUTABLE_CACHE = "public, max-age=31536000, immutable";

export const IMAGE_ACCEPT = IMAGE_MIME_TYPES.join(",");
export const VIDEO_ACCEPT = VIDEO_MIME_TYPES.join(",");

export function isImageMime(type: string): boolean {
  return (IMAGE_MIME_TYPES as readonly string[]).includes(type);
}

export function isVideoMime(type: string): boolean {
  return (VIDEO_MIME_TYPES as readonly string[]).includes(type);
}
