"use client";

import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
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
const DOUBLE_CLICK_MS = 300;
/**
 * Clicks this soon after opening are ignored: a visitor who double-taps the
 * card that opens the viewer would otherwise land the second tap on the image
 * as a "single tap" and close what they just opened.
 */
const OPEN_GRACE_MS = 400;
/** Zoom aims for this much larger than the image as shown… */
const ZOOM_FACTOR = 2.5;
/** …but never below this, even when the original file is small. */
const MIN_ZOOM_FACTOR = 1.6;

/** Where a tap landed, as a fraction of the image, so zoom can centre on it. */
interface Focus {
  x: number;
  y: number;
}

/** Full-screen image viewer: arrows / Esc, swipe, double click to zoom, single click to close. */
export function Lightbox({ items, index, onChange, labels }: Props) {
  const open = index !== null;
  /** Zoomed width in px, or null when the image fits the screen. */
  const [zoomWidth, setZoomWidth] = useState<number | null>(null);
  const zoomed = zoomWidth !== null;
  const stageRef = useRef<HTMLDivElement>(null);
  const focus = useRef<Focus | null>(null);
  const openedAt = useRef(0);
  const touchX = useRef<number | null>(null);
  const pendingClick = useRef<number | null>(null);
  const lastClickAt = useRef(0);

  useEffect(() => {
    if (open) openedAt.current = Date.now();
  }, [open]);
  const justOpened = () => Date.now() - openedAt.current < OPEN_GRACE_MS;
  // Portals need `document`, which does not exist during server rendering.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const clearPendingClick = useCallback(() => {
    if (pendingClick.current !== null) window.clearTimeout(pendingClick.current);
    pendingClick.current = null;
    lastClickAt.current = 0;
  }, []);
  useEffect(() => clearPendingClick, [clearPendingClick]);

  const go = useCallback(
    (delta: number) => {
      if (index === null) return;
      clearPendingClick();
      setZoomWidth(null);
      onChange((index + delta + items.length) % items.length);
    },
    [clearPendingClick, index, items.length, onChange],
  );
  const close = useCallback(() => {
    clearPendingClick();
    setZoomWidth(null);
    onChange(null);
  }, [clearPendingClick, onChange]);

  // After zooming in, scroll so the point that was tapped sits mid-screen.
  useLayoutEffect(() => {
    const stage = stageRef.current;
    const target = focus.current;
    if (!zoomed || !stage || !target) return;
    stage.scrollLeft = target.x * stage.scrollWidth - stage.clientWidth / 2;
    stage.scrollTop = target.y * stage.scrollHeight - stage.clientHeight / 2;
    focus.current = null;
  }, [zoomed]);

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
          onClick={() => !justOpened() && close()}
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
            ref={stageRef}
            className={`relative ${zoomed ? "flex h-full w-full overflow-auto" : "max-h-[90dvh] max-w-[92vw]"}`}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => {
              e.stopPropagation();
              if (justOpened()) return;
              const now = Date.now();
              if (now - lastClickAt.current >= DOUBLE_CLICK_MS) {
                // Possibly the first of two clicks: close only if no second one follows.
                lastClickAt.current = now;
                pendingClick.current = window.setTimeout(close, DOUBLE_CLICK_MS);
                return;
              }
              clearPendingClick();
              if (zoomed) {
                setZoomWidth(null);
                return;
              }
              const img = e.currentTarget.querySelector("img");
              if (!img) return;
              const shown = img.getBoundingClientRect();
              focus.current = {
                x: (e.clientX - shown.left) / shown.width,
                y: (e.clientY - shown.top) / shown.height,
              };
              // Up to the file's own resolution, so zooming reveals detail
              // instead of enlarging pixels — with a floor for small files.
              setZoomWidth(Math.max(shown.width * MIN_ZOOM_FACTOR, Math.min(shown.width * ZOOM_FACTOR, current.width)));
            }}
            style={{ cursor: zoomed ? "zoom-out" : "zoom-in", touchAction: "manipulation" }}
          >
            {/* Zoomed: m-auto, not justify-center — it centres a smaller image without clipping a larger one. */}
            {zoomed ? (
              <div className="m-auto shrink-0" style={{ width: zoomWidth }}>
                <Picture asset={current} sizes={`${Math.round(zoomWidth)}px`} priority className="w-full" />
              </div>
            ) : (
              <Picture asset={current} sizes="100vw" priority className="max-h-[90dvh] w-auto" imgClassName="max-h-[90dvh] w-auto" />
            )}
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
