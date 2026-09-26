"use client";

import { MoveHorizontal } from "lucide-react";
import { useState } from "react";
import { Picture } from "@/components/media/Picture";
import type { MediaAsset } from "@/lib/media/types";
import { widthForHeight } from "@/lib/media/fit";

const SIZES = "(min-width: 1024px) 1024px, 100vw";

/**
 * Compare two versions of a design. An invisible range input covers the
 * whole image, which gives mouse drag, touch drag and arrow keys for free.
 */
export function BeforeAfter({ before, after, maxHeight }: { before: MediaAsset; after: MediaAsset; maxHeight?: string }) {
  const [position, setPosition] = useState(50);

  return (
    // The cap belongs to the wrapper: the "after" layer and the handle are
    // positioned against it, so capping the image alone would misalign them.
    <div
      style={maxHeight ? { maxWidth: widthForHeight(before, maxHeight) } : undefined}
      className="relative mx-auto select-none overflow-hidden rounded-card"
    >
      <Picture asset={before} sizes={SIZES} />
      <div className="absolute inset-0" style={{ clipPath: `inset(0 0 0 ${position}%)` }}>
        <Picture asset={after} sizes={SIZES} fill />
      </div>

      <div className="pointer-events-none absolute inset-y-0 w-0.5 bg-white/90 shadow" style={{ left: `${position}%` }}>
        <span className="absolute left-1/2 top-1/2 grid size-11 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white text-black shadow-xl">
          <MoveHorizontal className="size-5" />
        </span>
      </div>

      <input
        type="range"
        min={0}
        max={100}
        step={0.5}
        value={position}
        onChange={(e) => setPosition(Number(e.target.value))}
        aria-label="Before / after"
        className="absolute inset-0 size-full cursor-ew-resize opacity-0"
      />
    </div>
  );
}
