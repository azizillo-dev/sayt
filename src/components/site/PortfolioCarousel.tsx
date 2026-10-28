"use client";

import { ChevronLeft, ChevronRight, Maximize2 } from "lucide-react";
import { useRef, useState } from "react";
import { Lightbox } from "@/components/media/Lightbox";
import { Picture } from "@/components/media/Picture";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { MediaAsset } from "@/lib/media/types";

type Labels = Dictionary["portfolio"] & { close: string };

/** Narrowest and widest card the carousel allows (width / height). */
const MIN_RATIO = 9 / 16;
const MAX_RATIO = 5 / 4;
const cardRatio = (image: MediaAsset) => Math.min(MAX_RATIO, Math.max(MIN_RATIO, image.width / image.height));

interface Props {
  /** The pictures of one work: its cover first, then its gallery. */
  images: MediaAsset[];
  title: string;
  labels: Labels;
}

/**
 * One work's pictures side by side: the current one in the centre, its
 * neighbours dimmed at the sides. Arrows, swipe or the keyboard move along;
 * the centre picture opens full screen.
 */
export function PortfolioCarousel({ images, title, labels }: Props) {
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState<number | null>(null);
  const touchStart = useRef<number | null>(null);
  const suppressClick = useRef(false);
  const count = images.length;

  const go = (delta: number) => setActive((current) => (current + delta + count) % count);
  const select = (index: number) => {
    if (suppressClick.current) return;
    if (index === active) setOpen(index);
    else setActive(index);
  };

  return <>
    <div tabIndex={0} aria-label={title} className="relative mx-auto w-full max-w-[1500px] overflow-hidden outline-none focus-visible:ring-2 focus-visible:ring-accent" onKeyDown={(event) => {
      if (event.key === "ArrowLeft") go(-1);
      if (event.key === "ArrowRight") go(1);
    }} onTouchStart={(event) => { touchStart.current = event.touches[0]?.clientX ?? null; }} onTouchEnd={(event) => {
      const end = event.changedTouches[0]?.clientX;
      if (touchStart.current !== null && end !== undefined && Math.abs(end - touchStart.current) > 55) {
        suppressClick.current = true;
        go(end < touchStart.current ? 1 : -1);
        window.setTimeout(() => { suppressClick.current = false; }, 350);
      }
      touchStart.current = null;
    }}>
      <div className="relative h-[470px] [--card-h:420px] sm:h-[600px] sm:[--card-h:540px] lg:h-[min(66svh,640px)] lg:[--card-h:min(60svh,580px)]" style={{ perspective: "1200px" }}>
        {images.map((image, index) => {
          let distance = index - active;
          if (distance > count / 2) distance -= count;
          if (distance < -count / 2) distance += count;
          const depth = Math.abs(distance);
          return <button key={image.id} type="button" onClick={() => select(index)}
            aria-label={index === active ? `${title} — ${labels.zoomHint}` : `${title} ${index + 1}`}
            aria-current={index === active ? "true" : undefined}
            aria-hidden={depth > 1}
            tabIndex={depth > 1 ? -1 : 0}
            className={`group absolute left-1/2 top-1/2 overflow-hidden rounded-[1.25rem] border border-white/20 bg-[#0d0f14] shadow-2xl shadow-black/30 outline-offset-4 transition-[transform,opacity,filter] duration-700 ease-out-expo ${index === active ? "cursor-zoom-in" : ""}`}
            style={{
              // Width follows the picture, so a 1080×1350 post fills its card with
              // no empty bands; extreme shapes are held within a sensible range.
              // On a narrow phone the height shrinks too, rather than the width
              // alone — which would leave bands above and below.
              aspectRatio: `${cardRatio(image)}`,
              height: `min(var(--card-h), calc(86vw / ${cardRatio(image)}))`,
              transform: `translate3d(calc(-50% + ${distance} * min(37vw, 275px)), -50%, ${-depth * 110}px) rotateY(${-distance * 11}deg) scale(${Math.max(0.64, 1 - depth * 0.13)})`,
              opacity: depth > 1 ? 0 : depth === 0 ? 1 : 0.46,
              filter: depth === 0 ? "none" : "blur(3px)",
              zIndex: 20 - depth,
              pointerEvents: depth > 1 ? "none" : "auto",
            }}>
            {/* The whole picture is shown, never cropped: the client asked to see it in full. */}
            <div aria-hidden className="absolute inset-0 scale-110 bg-cover bg-center opacity-45 blur-2xl" style={{ backgroundImage: `url(${image.url})` }} />
            <Picture asset={image} fill fit="contain" priority={index === active} sizes="(min-width: 640px) 720px, 86vw" alt={title} className="absolute inset-0" />
            {index === active && (
              <span className="absolute bottom-3 right-3 grid size-10 place-items-center rounded-full bg-black/55 text-white opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100">
                <Maximize2 className="size-4" />
              </span>
            )}
          </button>;
        })}
      </div>
      {count > 1 && (
        <div className="relative z-30 mx-auto flex max-w-lg items-center justify-center gap-5 px-5 pb-24 sm:gap-8 sm:pb-12">
          <button type="button" onClick={() => go(-1)} aria-label={labels.previous} className="grid size-11 place-items-center rounded-full border border-border transition-colors hover:border-accent hover:text-accent"><ChevronLeft className="size-5" /></button>
          <span className="min-w-16 text-center text-sm font-semibold tabular-nums text-muted">{String(active + 1).padStart(2, "0")} / {String(count).padStart(2, "0")}</span>
          <button type="button" onClick={() => go(1)} aria-label={labels.next} className="grid size-11 place-items-center rounded-full border border-border transition-colors hover:border-accent hover:text-accent"><ChevronRight className="size-5" /></button>
        </div>
      )}
    </div>
    <Lightbox items={images} index={open} onChange={setOpen} labels={{ close: labels.close }} />
  </>;
}
