"use client";

import { useEffect, useRef } from "react";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { VideoDisplayItem } from "@/lib/videos/queries";

export function VideoViewer({ items, initialIndex, labels }: { items: VideoDisplayItem[]; initialIndex: number; labels: Dictionary["videos"] }) {
  const feedRef = useRef<HTMLDivElement>(null);
  const ordered = [...items.slice(initialIndex), ...items.slice(0, initialIndex)];

  useEffect(() => {
    const feed = feedRef.current;
    if (!feed) return;
    const videos = [...feed.querySelectorAll("video")];
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        const video = entry.target as HTMLVideoElement;
        if (entry.isIntersecting && entry.intersectionRatio >= 0.65) {
          void video.play().catch(() => {});
        } else {
          video.pause();
        }
      }
    }, { root: feed, threshold: [0, 0.65] });
    videos.forEach((video) => observer.observe(video));
    return () => { observer.disconnect(); videos.forEach((video) => video.pause()); };
  }, []);

  return <div ref={feedRef} aria-label={labels.feed}
    className="mt-4 h-[calc(100dvh-var(--header-h)-4.5rem)] min-h-[420px] snap-y snap-mandatory overflow-y-auto rounded-2xl bg-[#101014] text-white max-sm:rounded-none">
    {ordered.map((item, index) => <section key={item.id} data-reel-id={item.id} className="relative flex h-full snap-start snap-always flex-col items-center overflow-hidden">
      <div className="flex h-14 w-full shrink-0 items-center justify-between gap-3 px-4 sm:px-6">
        <h2 className="min-w-0 truncate font-display text-base font-bold sm:text-lg">{item.title}</h2>
        <p className="shrink-0 text-xs font-semibold text-white/70">{index + 1} / {ordered.length}{ordered.length > 1 && <span className="ml-2"><span className="hidden sm:inline">{labels.scrollHint} </span>↓</span>}</p>
      </div>
      <div className="relative min-h-0 w-full max-w-[430px] flex-1 bg-black">
        <video src={item.src} poster={item.cover.url} muted loop playsInline controls preload={index === 0 ? "metadata" : "none"}
          aria-label={item.title} className="size-full object-contain" />
      </div>
    </section>)}
  </div>;
}
