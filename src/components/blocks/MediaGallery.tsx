"use client";

import { useState } from "react";
import { Lightbox } from "@/components/media/Lightbox";
import { Picture } from "@/components/media/Picture";
import type { MediaAsset } from "@/lib/media/types";
import { cn } from "@/lib/cn";
import { widthForHeight } from "@/lib/media/fit";

interface Props {
  items: MediaAsset[];
  columns: 1 | 2 | 3;
  closeLabel: string;
  /** Height cap — only worth setting for single-column images, which get the full width. */
  maxHeight?: string;
}

const gridCols = { 1: "grid-cols-1", 2: "sm:grid-cols-2", 3: "sm:grid-cols-2 lg:grid-cols-3" } as const;
const sizes = {
  1: "(min-width: 1400px) 1400px, 100vw",
  2: "(min-width: 640px) 50vw, 100vw",
  3: "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw",
} as const;

/** One or more images that open in the lightbox when clicked. */
export function MediaGallery({ items, columns, closeLabel, maxHeight }: Props) {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <>
      <div className={cn("grid gap-3 sm:gap-4", gridCols[columns])}>
        {items.map((asset, i) => (
          <button
            key={asset.id}
            type="button"
            onClick={() => setOpen(i)}
            // The cap lives on the button so the zoom area matches the picture.
            style={maxHeight ? { maxWidth: widthForHeight(asset, maxHeight) } : undefined}
            className="group mx-auto block w-full cursor-zoom-in overflow-hidden rounded-card-sm"
          >
            <Picture
              asset={asset}
              sizes={sizes[columns]}
              imgClassName="transition-transform duration-[1.2s] ease-out-expo group-hover:scale-[1.02]"
            />
          </button>
        ))}
      </div>
      <Lightbox items={items} index={open} onChange={setOpen} labels={{ close: closeLabel }} />
    </>
  );
}
