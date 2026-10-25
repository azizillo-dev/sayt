"use client";

import { ArrowUpRight, ChevronLeft, ChevronRight, FileText } from "lucide-react";
import { useRef, useState } from "react";
import { Lightbox } from "@/components/media/Lightbox";
import { Picture } from "@/components/media/Picture";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { PortfolioDisplayItem } from "@/lib/portfolio/queries";

type Labels = Dictionary["portfolio"] & { close: string };

export function PortfolioCarousel({ items, labels, initialIndex = 0 }: { items: PortfolioDisplayItem[]; labels: Labels; initialIndex?: number }) {
  const [active, setActive] = useState(initialIndex);
  const [openGallery, setOpenGallery] = useState<number | null>(null);
  const [galleryIndex, setGalleryIndex] = useState<number | null>(null);
  const touchStart = useRef<number | null>(null);
  const suppressClick = useRef(false);
  const selected = items[active];

  const go = (delta: number) => setActive((current) => (current + delta + items.length) % items.length);
  const open = (index: number) => {
    if (suppressClick.current) return;
    if (index !== active) { setActive(index); return; }
    const item = items[index];
    if (!item) return;
    if (item.openMode === "pdf" && item.pdfUrl) window.open(item.pdfUrl, "_blank", "noopener,noreferrer");
    else { setOpenGallery(index); setGalleryIndex(0); }
  };

  return <>
    <div tabIndex={0} aria-label={labels.works} className="relative mx-auto w-full max-w-[1500px] overflow-hidden outline-none focus-visible:ring-2 focus-visible:ring-accent" onKeyDown={(event) => {
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
      <div className="relative h-[430px] sm:h-[550px] lg:h-[min(56svh,520px)]" style={{ perspective: "1200px" }}>
        {items.map((item, index) => {
          let distance = index - active;
          if (distance > items.length / 2) distance -= items.length;
          if (distance < -items.length / 2) distance += items.length;
          const depth = Math.abs(distance);
          return <button key={item.id} type="button" onClick={() => open(index)}
            aria-label={`${item.title}${index === active ? ` — ${item.openMode === "pdf" ? "PDF" : labels.gallery}` : ""}`}
            aria-current={index === active ? "true" : undefined}
            aria-hidden={depth > 1}
            tabIndex={depth > 1 ? -1 : 0}
            className="absolute left-1/2 top-1/2 h-[355px] w-[min(68vw,390px)] overflow-hidden rounded-[1.25rem] border border-white/20 bg-surface text-left shadow-2xl shadow-black/30 outline-offset-4 transition-[transform,opacity,filter] duration-700 ease-out-expo sm:h-[465px] lg:h-[min(48svh,460px)]"
            style={{
              transform: `translate3d(calc(-50% + ${distance} * min(37vw, 275px)), -50%, ${-depth * 110}px) rotateY(${-distance * 11}deg) scale(${Math.max(0.64, 1 - depth * 0.13)})`,
              opacity: depth > 1 ? 0 : depth === 0 ? 1 : 0.46,
              filter: depth === 0 ? "none" : "blur(3px)",
              zIndex: 20 - depth,
              pointerEvents: depth > 1 ? "none" : "auto",
            }}>
            <Picture asset={item.cover} fill fit="cover" priority={index === active} sizes="(min-width: 1024px) 390px, 68vw" />
            <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 bg-gradient-to-t from-black/85 via-black/45 to-transparent px-5 pb-6 pt-24 text-white sm:px-7 sm:pb-8">
              <span className="min-w-0 font-display text-xl font-bold leading-tight sm:text-2xl">{item.title}</span>
              {index === active && <span className="grid size-10 shrink-0 place-items-center rounded-full bg-white text-black">{item.openMode === "pdf" ? <FileText className="size-5" /> : <ArrowUpRight className="size-5" />}</span>}
            </div>
          </button>;
        })}
      </div>
      <div className="relative z-30 mx-auto flex max-w-lg items-center justify-center gap-5 px-5 pb-8 sm:gap-8">
        <button type="button" onClick={() => go(-1)} disabled={items.length < 2} aria-label={labels.previous} className="grid size-11 place-items-center rounded-full border border-border transition-colors hover:border-accent hover:text-accent disabled:opacity-30"><ChevronLeft className="size-5" /></button>
        <span className="min-w-16 text-center text-sm font-semibold tabular-nums text-muted">{String(active + 1).padStart(2, "0")} / {String(items.length).padStart(2, "0")}</span>
        <button type="button" onClick={() => go(1)} disabled={items.length < 2} aria-label={labels.next} className="grid size-11 place-items-center rounded-full border border-border transition-colors hover:border-accent hover:text-accent disabled:opacity-30"><ChevronRight className="size-5" /></button>
      </div>
      {selected && <p className="mx-auto max-w-[15rem] px-5 pb-24 text-center text-sm text-muted sm:max-w-none sm:pb-12">{selected.openMode === "pdf" ? labels.openPdf : labels.openGallery}</p>}
    </div>
    <Lightbox items={openGallery === null ? [] : items[openGallery]?.gallery ?? []} index={galleryIndex} onChange={(index) => {
      setGalleryIndex(index);
      if (index === null) setOpenGallery(null);
    }} labels={{ close: labels.close }} />
  </>;
}
