"use client";

import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { MediaAsset } from "@/lib/media/types";
import { Picture } from "./Picture";

interface Props {
  items: MediaAsset[];
  index: number | null;
  onChange: (index: number | null) => void;
  labels: { close: string };
}

const SWIPE_THRESHOLD = 60;

/** Full-screen image viewer: arrows / Esc on keyboard, swipe on touch, click to zoom. */
export function Lightbox({ items, index, onChange, labels }: Props) {
  const open = index !== null;
  const [zoomed, setZoomed] = useState(false);
  const touchX = useRef<number | null>(null);
  // Portals need `document`, which does not exist during server rendering.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const go = useCallback(
    (delta: number) => {
      if (index === null) return;
      setZoomed(false);
      onChange((index + delta + items.length) % items.length);
    },
    [index, items.length, onChange],
  );
  const close = useCallback(() => {
    setZoomed(false);
    onChange(null);
  }, [onChange]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    const root = document.documentElement;
    const previous = root.style.overflow;
    root.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      root.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, close, go]);

  const current = index === null ? null : items[index];
  const multiple = items.length > 1;

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {current && (
        <motion.div
          key="lightbox"
          role="dialog"
          aria-modal="true"
          data-lenis-prevent
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/92 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onClick={close}
          onTouchStart={(e) => (touchX.current = e.touches[0]?.clientX ?? null)}
          onTouchEnd={(e) => {
            const start = touchX.current;
            const end = e.changedTouches[0]?.clientX;
            if (start == null || end == null || zoomed) return;
            if (Math.abs(end - start) > SWIPE_THRESHOLD) go(end < start ? 1 : -1);
          }}
        >
          <motion.div
            key={current.id}
            className={`relative ${zoomed ? "h-full w-full overflow-auto" : "max-h-[90dvh] max-w-[92vw]"}`}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => {
              e.stopPropagation();
              setZoomed((z) => !z);
            }}
            style={{ cursor: zoomed ? "zoom-out" : "zoom-in" }}
          >
            <Picture
              asset={current}
              sizes="100vw"
              priority
              className={zoomed ? "min-w-full" : "max-h-[90dvh] w-auto"}
              imgClassName={zoomed ? "max-w-none w-[200%] sm:w-auto" : "max-h-[90dvh] w-auto"}
            />
          </motion.div>

          <button type="button" onClick={close} aria-label={labels.close} className={controlClass("right-4 top-4")}>
            <X className="size-5" />
          </button>
          {multiple && (
            <>
              <button
                type="button"
                aria-label="←"
                onClick={(e) => (e.stopPropagation(), go(-1))}
                className={controlClass("left-4 top-1/2 -translate-y-1/2 max-sm:hidden")}
              >
                <ChevronLeft className="size-5" />
              </button>
              <button
                type="button"
                aria-label="→"
                onClick={(e) => (e.stopPropagation(), go(1))}
                className={controlClass("right-4 top-1/2 -translate-y-1/2 max-sm:hidden")}
              >
                <ChevronRight className="size-5" />
              </button>
              <span className="absolute bottom-5 left-1/2 -translate-x-1/2 text-sm tabular-nums text-white/70">
                {index! + 1} / {items.length}
              </span>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

function controlClass(position: string) {
  return `absolute ${position} grid size-11 place-items-center rounded-full bg-white/10 text-white backdrop-blur transition-colors hover:bg-white/20`;
}
