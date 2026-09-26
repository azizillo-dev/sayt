import type { MediaAsset } from "./types";

/** Smallest generated variant — for admin thumbnails, so lists stay light. */
export function thumbUrl(asset: MediaAsset): string {
  const srcSet = asset.sources.find((s) => s.format === "webp")?.srcSet;
  return srcSet?.split(",")[0]?.trim().split(" ")[0] ?? asset.url;
}
