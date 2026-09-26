"use client";

import { Play } from "lucide-react";
import { useState } from "react";
import { youtubeId } from "@/lib/youtube";

/**
 * "Lite" YouTube player: shows the thumbnail and loads the ~1 MB YouTube
 * iframe only after the visitor presses play.
 */
export function YouTubeEmbed({ url, title, playLabel }: { url: string; title: string; playLabel: string }) {
  const id = youtubeId(url);
  const [active, setActive] = useState(false);
  const [thumb, setThumb] = useState<"maxresdefault" | "hqdefault">("maxresdefault");

  if (!id) return null;

  return (
    <div className="relative aspect-video overflow-hidden rounded-card bg-black">
      {active ? (
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&modestbranding=1&playsinline=1`}
          title={title}
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
          className="absolute inset-0 size-full border-0"
        />
      ) : (
        <button
          type="button"
          onClick={() => setActive(true)}
          aria-label={playLabel}
          className="group absolute inset-0 grid place-items-center"
        >
          <img
            src={`https://i.ytimg.com/vi/${id}/${thumb}.jpg`}
            alt=""
            loading="lazy"
            decoding="async"
            // maxresdefault does not exist for every video; YouTube answers with a 120px grey stub.
            onLoad={(e) => e.currentTarget.naturalWidth <= 120 && setThumb("hqdefault")}
            onError={() => setThumb("hqdefault")}
            className="absolute inset-0 size-full object-cover transition-transform duration-700 ease-out-expo group-hover:scale-[1.03]"
          />
          <span className="absolute inset-0 bg-black/20 transition-colors duration-500 group-hover:bg-black/35" />
          <span className="relative grid size-18 place-items-center rounded-full bg-white/90 text-black shadow-2xl backdrop-blur transition-transform duration-500 ease-out-expo group-hover:scale-110 sm:size-22">
            <Play className="ml-1 size-7 fill-current" />
          </span>
        </button>
      )}
    </div>
  );
}
