"use client";

import { useEffect, useRef } from "react";
import type { MediaAsset } from "@/lib/media/types";
import { cn } from "@/lib/cn";
import { widthForHeight } from "@/lib/media/fit";

/**
 * Short silent loop (≤10 s animation). It downloads only when near the
 * viewport and pauses off-screen, so a page full of loops stays smooth.
 */
export function LoopVideo({
  asset,
  maxHeight,
  className,
}: {
  asset: MediaAsset;
  /** Keep the video within this height, like `Picture`. */
  maxHeight?: string;
  className?: string;
}) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          if (video.preload === "none") video.preload = "auto";
          if (!reduceMotion) video.play().catch(() => {});
        } else {
          video.pause();
        }
      },
      { rootMargin: "200px 0px" },
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  return (
    <video
      ref={ref}
      src={asset.url}
      width={asset.width}
      height={asset.height}
      style={{
        aspectRatio: `${asset.width} / ${asset.height}`,
        ...(maxHeight ? { maxWidth: widthForHeight(asset, maxHeight) } : {}),
      }}
      className={cn("mx-auto block h-auto w-full bg-surface", className)}
      muted
      loop
      playsInline
      preload="none"
      disablePictureInPicture
      aria-label={asset.alt || undefined}
    />
  );
}
