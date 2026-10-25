"use client";

import Link from "next/link";
import { useState } from "react";
import { Picture } from "@/components/media/Picture";
import type { Locale } from "@/lib/i18n/config";
import type { MediaAsset } from "@/lib/media/types";
import { portfolioCategories, type PortfolioCategory } from "@/lib/portfolio/categories";

type Covers = Record<PortfolioCategory, MediaAsset | null>;

/**
 * The lit seam where the image meets the bar, as in the brief: a hairline
 * of light with a soft glow spilling onto the picture.
 */
function EdgeLight({ edge }: { edge: "top" | "bottom" }) {
  const top = edge === "top";
  return (
    <div aria-hidden="true" className={`pointer-events-none absolute inset-x-0 z-20 ${top ? "top-0" : "bottom-0"}`}>
      {/* The beam itself, with a halo so it reads as light rather than a border. */}
      <div className="h-[2px] bg-[linear-gradient(90deg,transparent,rgba(160,190,255,.7)_15%,#f4f7ff_50%,rgba(160,190,255,.7)_85%,transparent)] shadow-[0_0_12px_2px_rgba(150,185,255,.85)]" />
      {/* The glow it casts onto the picture. */}
      <div
        className={`absolute inset-x-0 h-24 sm:h-32 ${top ? "top-0" : "bottom-0"}`}
        style={{ background: `radial-gradient(55% 100% at 50% ${top ? "0%" : "100%"}, rgba(140,175,255,.75), rgba(140,175,255,.18) 45%, transparent 75%)` }}
      />
    </div>
  );
}

export function PortfolioCategories({ locale, covers, fallback }: { locale: Locale; covers: Covers; fallback: MediaAsset | null }) {
  const [active, setActive] = useState<PortfolioCategory>("logo-branding");
  const cover = covers[active] ?? fallback;

  return <section id="work" className="mx-auto max-w-[1400px] scroll-mt-20 px-5 py-10 sm:px-8 sm:py-12">
    <div className="w-full overflow-hidden rounded-card border border-white/15 bg-[#101b34] shadow-[0_30px_90px_-35px_rgba(10,15,38,0.65)]">
      <div className="relative z-10 flex h-16 items-center justify-center bg-[linear-gradient(105deg,#424171,#171d43_70%,#0e1737)] px-5 sm:h-20">
        <h2 className="font-display text-2xl font-bold tracking-[-0.035em] text-white sm:text-4xl">Portfolio</h2>
      </div>
      <div className="relative aspect-video overflow-hidden bg-[#111827] sm:aspect-auto sm:h-[min(600px,calc(100svh-19rem))]">
        {cover && <div aria-hidden="true" className="absolute inset-0 scale-110 bg-cover bg-center opacity-35 blur-2xl" style={{ backgroundImage: `url(${cover.url})` }} />}
        {cover ? <Picture key={cover.id} asset={cover} fill fit="contain" sizes="(min-width: 1400px) 1100px, 100vw" alt={portfolioCategories.find((category) => category.slug === active)?.title ?? "Portfolio"} className="absolute inset-0 z-10" imgClassName="object-center" />
          : <div className="absolute inset-0 bg-[url('/portfolio-studio.webp')] bg-cover bg-center" role="img" aria-label="Dizayn studiyasi" />}
        <EdgeLight edge="top" />
        <EdgeLight edge="bottom" />
        {!covers[active] && !fallback && <p className="absolute inset-x-0 top-6 text-center font-display text-2xl font-bold text-white drop-shadow-lg sm:top-10 sm:text-5xl">{portfolioCategories.find((category) => category.slug === active)?.title}</p>}
      </div>
      <nav aria-label="Portfolio bo‘limlari" className="grid grid-cols-2 gap-2 bg-[linear-gradient(105deg,#424171,#171d43_70%,#0e1737)] p-3 sm:grid-cols-4 sm:gap-3 sm:p-5">
        {portfolioCategories.map((category) => <Link key={category.slug} href={`/${locale}/portfolio/${category.slug}`}
          onMouseEnter={() => setActive(category.slug)} onFocus={() => setActive(category.slug)}
          className="flex min-h-12 items-center justify-center rounded-full border border-white/50 bg-[#f9c9b8] px-2 py-2 text-center text-[11px] font-bold leading-tight text-[#33243a] shadow-lg shadow-black/20 transition-[background-color,transform,box-shadow] duration-200 hover:-translate-y-1 hover:bg-white hover:shadow-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:min-h-14 sm:px-3 sm:text-sm">
          {category.title}
        </Link>)}
      </nav>
    </div>
  </section>;
}
