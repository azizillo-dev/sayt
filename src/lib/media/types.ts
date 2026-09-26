export type ImageFormat = "avif" | "webp";

export interface MediaVariant {
  format: ImageFormat;
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
}

export type MediaMap = Record<string, MediaAsset>;
