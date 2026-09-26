"use client";

import { useCallback, useState, type CSSProperties } from "react";
import type { MediaAsset } from "@/lib/media/types";
import { cn } from "@/lib/cn";
import { widthForHeight } from "@/lib/media/fit";

interface Props {
  asset: MediaAsset;
  /** The `sizes` attribute — how wide the image is rendered at each breakpoint. */
  sizes?: string;
  /** Above-the-fold images: load eagerly with high priority and skip the fade. */
  priority?: boolean;
  /** Cover a parent box (which must be `relative` with a set aspect ratio). */
  fill?: boolean;
  /** How a `fill` image sits in its box. `contain` keeps a cut-out portrait whole. */
  fit?: "cover" | "contain";
  /** No placeholder background — for transparent logos and icons. */
  bare?: boolean;
  /** Override lazy loading, e.g. for images moving into view inside a marquee. */
  loading?: "lazy" | "eager";
  /** Keep the image within this height (e.g. `"72dvh"`); tall images centre instead. */
  maxHeight?: string;
  alt?: string;
  className?: string;
  imgClassName?: string;
}

/**
 * Responsive image built from the variants generated at upload time.
 *
 * - AVIF → WebP → fallback, chosen by the browser via <picture>.
 * - Intrinsic width/height reserve space, so nothing jumps while loading.
 * - A tiny blurred placeholder (and the dominant colour behind it) shows
 *   instantly, then the real image fades in.
 */
export function Picture({
  asset,
  sizes = "100vw",
  priority = false,
  fill = false,
  fit = "cover",
  bare = false,
  loading,
  maxHeight,
  alt,
  className,
  imgClassName,
}: Props) {
  const [loaded, setLoaded] = useState(priority);

  // Cached images can finish before hydration, so `onLoad` would never fire.
  const imgRef = useCallback((img: HTMLImageElement | null) => {
    if (img?.complete && img.naturalWidth > 0) setLoaded(true);
  }, []);

  const placeholderStyle: CSSProperties = {
    ...(bare
      ? {}
      : {
          backgroundColor: loaded ? undefined : (asset.dominantColor ?? undefined),
          backgroundImage: asset.placeholder && !loaded ? `url(${asset.placeholder})` : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }),
    ...(fill ? {} : { aspectRatio: `${asset.width} / ${asset.height}` }),
    ...(fill || !maxHeight ? {} : { maxWidth: widthForHeight(asset, maxHeight) }),
  };

  return (
    <picture
      className={cn("block overflow-hidden", fill && "absolute inset-0", maxHeight && !fill && "mx-auto", className)}
      style={placeholderStyle}
    >
      {asset.sources.map((source) => (
        <source key={source.format} type={`image/${source.format}`} srcSet={source.srcSet} sizes={sizes} />
      ))}
      <img
        ref={imgRef}
        src={asset.url}
        alt={alt ?? asset.alt}
        width={asset.width}
        height={asset.height}
        loading={loading ?? (priority ? "eager" : "lazy")}
        fetchPriority={priority ? "high" : "auto"}
        decoding={priority ? "sync" : "async"}
        onLoad={() => setLoaded(true)}
        draggable={false}
        className={cn(
          "block h-full w-full transition-opacity duration-700 ease-out-expo",
          fill && fit === "cover" ? "object-cover" : "object-contain",
          loaded ? "opacity-100" : "opacity-0",
          imgClassName,
        )}
      />
    </picture>
  );
}
