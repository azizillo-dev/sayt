import { thumbUrl } from "@/lib/media/thumb";
import type { MediaAsset } from "@/lib/media/types";
import { cn } from "@/lib/cn";

/** Lightweight admin preview: smallest image variant, or a muted looping video. */
export function MediaPreview({ asset, className, contain }: { asset: MediaAsset; className?: string; contain?: boolean }) {
  const fit = contain ? "object-contain" : "object-cover";
  if (asset.kind === "video") {
    return <video src={asset.url} muted loop autoPlay playsInline className={cn("size-full", fit, className)} />;
  }
  return (
    <img
      src={thumbUrl(asset)}
      alt={asset.alt}
      loading="lazy"
      decoding="async"
      className={cn("size-full", fit, className)}
      style={{ backgroundColor: asset.dominantColor ?? undefined }}
    />
  );
}
