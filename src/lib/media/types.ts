export type ImageFormat = "avif" | "webp";

export interface MediaVariant {
  /** Image sizes are AVIF/WebP; a video's light looping preview is MP4. */
  format: ImageFormat | "mp4";
  width: number;
  height: number;
  key: string;
}

/** Media as sent to components: storage keys resolved to public URLs. */
export interface MediaAsset {
  id: string;
  kind: "image" | "video";
  url: string;
  mimeType: string;
  width: number;
  height: number;
  alt: string;
  placeholder: string | null;
  dominantColor: string | null;
  sources: { format: ImageFormat; srcSet: string }[];
  /** Videos only: the short, light, silent version for looping cards. */
  preview: string | null;
}

export type MediaMap = Record<string, MediaAsset>;
