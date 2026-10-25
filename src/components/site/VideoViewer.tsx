"use client";

import { ChevronDown, ChevronUp, Play, Volume2, VolumeX, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { canGoBackInSite } from "@/lib/client-history";
import { lockPageScroll } from "@/lib/scroll-lock";
import type { VideoDisplayItem } from "@/lib/videos/queries";
import { cn } from "@/lib/cn";

type Labels = Dictionary["videos"] & { close: string; play: string };

interface Props {
  items: VideoDisplayItem[];
  initialIndex: number;
  labels: Labels;
  /** `/uz/videos` — the address bar follows the reel on screen. */
  basePath: string;
}

/** A wheel gesture counts once it has moved this far… */
const WHEEL_STEP = 30;
/** …and the next one is accepted only after the wheel has rested this long. */
const WHEEL_REST_MS = 220;

/**
 * Full-screen reels, as on Instagram: one portrait video per screen, scroll
 * or swipe for the next, tap to pause, sound off until the visitor turns it
 * on — after which it stays on for the following reels.
 */
export function VideoViewer({ items, initialIndex, labels, basePath }: Props) {
  const router = useRouter();
  const feedRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const barRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [active, setActive] = useState(initialIndex);
  const [muted, setMuted] = useState(true);
  const [paused, setPaused] = useState(false);

  const go = useCallback((target: number) => {
    const feed = feedRef.current;
    if (!feed || target < 0 || target >= items.length) return;
    feed.scrollTo({ top: target * feed.clientHeight, behavior: "smooth" });
  }, [items.length]);

  const close = useCallback(() => {
    if (canGoBackInSite()) router.back();
    else router.push(basePath);
  }, [router, basePath]);

  // Open on the reel that was clicked, with the page behind locked in place.
  useEffect(() => {
    const feed = feedRef.current;
    if (feed) feed.scrollTop = initialIndex * feed.clientHeight;
    return lockPageScroll();
  }, [initialIndex]);

  // The reel filling most of the screen is the active one.
  useEffect(() => {
    const feed = feedRef.current;
    if (!feed) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(Number((entry.target as HTMLElement).dataset.index));
        }
      },
      { root: feed, threshold: 0.6 },
    );
    feed.querySelectorAll("[data-index]").forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  // Only the active reel plays; it starts from where the visitor left it.
  useEffect(() => {
    setPaused(false);
    videoRefs.current.forEach((video, index) => {
      if (!video) return;
      if (index !== active) {
        video.pause();
        return;
      }
      video.muted = muted;
      // Unmuted autoplay can be refused before any interaction: fall back to muted.
      video.play().catch(() => {
        video.muted = true;
        setMuted(true);
        void video.play().catch(() => setPaused(true));
      });
    });
    const item = items[active];
    if (item) window.history.replaceState(window.history.state, "", `${basePath}/${item.id}`);
    // `muted` is left out on purpose: its own effect applies it, and restarting
    // playback whenever it changes would stutter.
  }, [active, items, basePath]);

  useEffect(() => {
    const video = videoRefs.current[active];
    if (video) video.muted = muted;
  }, [muted, active]);

  // Progress bar, driven per frame without re-rendering React.
  useEffect(() => {
    let frame = 0;
    const tick = () => {
      const video = videoRefs.current[active];
      const bar = barRefs.current[active];
      if (video && bar && video.duration) bar.style.transform = `scaleX(${video.currentTime / video.duration})`;
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [active]);

  // One wheel gesture = one reel. Snap scrolling alone would pull a single
  // wheel notch back to the same reel, and a trackpad's inertia would skip several.
  useEffect(() => {
    const feed = feedRef.current;
    if (!feed) return;
    let travelled = 0;
    let locked = false;
    let rest = 0;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      window.clearTimeout(rest);
      rest = window.setTimeout(() => {
        locked = false;
        travelled = 0;
      }, WHEEL_REST_MS);
      if (locked) return;
      travelled += event.deltaY;
      if (Math.abs(travelled) < WHEEL_STEP) return;
      locked = true;
      const current = Math.round(feed.scrollTop / feed.clientHeight);
      go(current + Math.sign(travelled));
    };
    feed.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      feed.removeEventListener("wheel", onWheel);
      window.clearTimeout(rest);
    };
  }, [go]);

  const togglePlay = useCallback(() => {
    const video = videoRefs.current[active];
    if (!video) return;
    if (video.paused) {
      void video.play();
      setPaused(false);
    } else {
      video.pause();
      setPaused(true);
    }
  }, [active]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "ArrowDown" || event.key === "j") (event.preventDefault(), go(active + 1));
      else if (event.key === "ArrowUp" || event.key === "k") (event.preventDefault(), go(active - 1));
      else if (event.key === " ") (event.preventDefault(), togglePlay());
      else if (event.key === "m") setMuted((value) => !value);
      else if (event.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, go, togglePlay, close]);

  const roundButton =
    "grid size-11 place-items-center rounded-full bg-white/12 text-white backdrop-blur-md transition-colors hover:bg-white/25 disabled:pointer-events-none disabled:opacity-30";

  return (
    <div role="dialog" aria-modal="true" aria-label={labels.feed} className="fixed inset-0 z-[70] bg-black text-white">
      <h1 className="sr-only">{items[active]?.title}</h1>

      {/* data-lenis-prevent: the site's smooth scrolling would otherwise swallow the wheel here. */}
      <div
        ref={feedRef}
        data-lenis-prevent
        className="h-full snap-y snap-mandatory overflow-y-auto overscroll-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((item, index) => {
          const near = Math.abs(index - active) <= 1;
          return (
            <section key={item.id} data-index={index} className="relative flex h-full snap-start snap-always items-center justify-center sm:py-4">
              {/* Phone: edge to edge. Larger screens: a 9:16 card as tall as the screen. */}
              <div className="relative h-full w-full overflow-hidden bg-neutral-900 sm:aspect-[9/16] sm:w-auto sm:max-w-full sm:rounded-2xl">
                <video
                  ref={(node) => {
                    videoRefs.current[index] = node;
                  }}
                  src={item.src}
                  poster={item.cover.url}
                  muted
                  loop
                  playsInline
                  preload={near ? "auto" : "metadata"}
                  onClick={togglePlay}
                  className="absolute inset-0 size-full cursor-pointer object-cover"
                />

                {paused && index === active && (
                  <span className="pointer-events-none absolute left-1/2 top-1/2 grid size-20 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-black/45 backdrop-blur-sm">
                    <Play className="ml-1 size-9 fill-white" aria-hidden="true" />
                  </span>
                )}

                <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 bg-gradient-to-t from-black/75 via-black/25 to-transparent px-4 pb-6 pt-24 sm:px-5">
                  <p className="min-w-0 font-display text-base font-bold leading-snug drop-shadow sm:text-lg">{item.title}</p>
                  <button
                    type="button"
                    onClick={() => setMuted((value) => !value)}
                    aria-label={muted ? labels.unmute : labels.mute}
                    aria-pressed={!muted}
                    className="pointer-events-auto grid size-9 shrink-0 place-items-center rounded-full bg-black/50 backdrop-blur-sm transition-colors hover:bg-black/70"
                  >
                    {muted ? <VolumeX className="size-[18px]" /> : <Volume2 className="size-[18px]" />}
                  </button>
                </div>

                <div className="absolute inset-x-0 bottom-0 h-[3px] bg-white/25">
                  <div
                    ref={(node) => {
                      barRefs.current[index] = node;
                    }}
                    className="h-full origin-left scale-x-0 bg-white"
                  />
                </div>
              </div>
            </section>
          );
        })}
      </div>

      <button type="button" onClick={close} aria-label={labels.close} className={cn(roundButton, "absolute left-4 top-4 sm:left-6 sm:top-6")}>
        <X className="size-5" />
      </button>

      {items.length > 1 && (
        <div className="absolute right-6 top-1/2 hidden -translate-y-1/2 flex-col gap-3 sm:flex">
          <button type="button" onClick={() => go(active - 1)} disabled={active === 0} aria-label={labels.previous} className={roundButton}>
            <ChevronUp className="size-5" />
          </button>
          <button type="button" onClick={() => go(active + 1)} disabled={active === items.length - 1} aria-label={labels.next} className={roundButton}>
            <ChevronDown className="size-5" />
          </button>
        </div>
      )}
    </div>
  );
}
