import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import type { Locale } from "@/lib/i18n/config";
import type { VideoDisplayItem } from "@/lib/videos/queries";

export function VideoCard({ item, locale }: { item: VideoDisplayItem; locale: Locale }) {
  return <Link href={`/${locale}/videos/${item.id}`} className="group block w-full min-w-0 overflow-hidden rounded-[1.25rem] border border-border bg-surface shadow-[0_20px_45px_-30px_rgba(0,0,0,.65)] transition-transform duration-300 hover:-translate-y-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
    <div className="relative aspect-[9/16] overflow-hidden bg-bg">
      <video src={item.src} poster={item.cover.url} autoPlay loop muted playsInline preload="metadata" aria-hidden="true" className="pointer-events-none size-full object-cover transition-transform duration-500 group-hover:scale-[1.035]" />
      <span className="absolute right-3 top-3 grid size-10 place-items-center rounded-full border border-white/60 bg-black/45 text-white backdrop-blur-sm transition-transform group-hover:scale-110"><ArrowUpRight className="size-5" /></span>
    </div>
    <p className="truncate px-3 py-3 text-sm font-semibold">{item.title}</p>
  </Link>;
}
