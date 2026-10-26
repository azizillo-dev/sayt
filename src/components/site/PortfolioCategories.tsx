"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
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

/**
 * One frame around title, picture and buttons: a single gradient on the card,
 * so there is no seam where the parts meet. Pictures move inside it.
 */
const BAR = "bg-[linear-gradient(105deg,#424171,#171d43_70%,#0e1737)]";

/** How long each section's picture stays before the banner moves on. */
const ROTATE_MS = 4500;

export function PortfolioCategories({ locale, covers, fallback }: { locale: Locale; covers: Covers; fallback: MediaAsset | null }) {
  /** The section shown, the one sliding out, and which way they move (1 = leftwards, to the next). */
  const [slide, setSlide] = useState<{ active: number; leaving: number | null; dir: 1 | -1 }>({ active: 0, leaving: null, dir: 1 });
  const active = portfolioCategories[slide.active]!.slug;
  /** Pointing at a section slides towards it: from the right for later ones, the left for earlier. */
  const show = (index: number) =>
    setSlide((current) =>
      index === current.active ? current : { active: index, leaving: current.active, dir: index > current.active ? 1 : -1 },
    );
  const showSlug = (slug: PortfolioCategory) => show(portfolioCategories.findIndex((category) => category.slug === slug));
  /** While the visitor points at the block, it shows what they point at and stops rotating. */
  const [held, setHeld] = useState(false);
  const title = (slug: PortfolioCategory) => portfolioCategories.find((category) => category.slug === slug)?.title ?? "Portfolio";

  useEffect(() => {
    if (held || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // Always onward, so the last section hands over to the first from the right too.
    const timer = window.setInterval(() => {
      setSlide((current) => {
        const next = (current.active + 1) % portfolioCategories.length;
        return { active: next, leaving: current.active, dir: 1 };
      });
    }, ROTATE_MS);
    return () => window.clearInterval(timer);
  }, [held]);

  const shown = covers[active] ?? fallback;

  return <section id="work" className="mx-auto max-w-[1400px] scroll-mt-20 px-5 py-10 sm:px-8 sm:py-12">
    <div
      className={`w-full overflow-hidden rounded-card border border-white/15 ${BAR} shadow-[0_30px_90px_-35px_rgba(10,15,38,0.65)]`}
      onMouseEnter={() => setHeld(true)}
      onMouseLeave={() => setHeld(false)}
    >
      <div className="relative z-10 flex h-16 items-center justify-center px-5 sm:h-20">
        <h2 className="font-display text-2xl font-bold tracking-[-0.035em] text-white sm:text-4xl">Portfolio</h2>
      </div>
      {/* A size container: each picture is sized against it (cqw/cqh) below. */}
      <div className="relative aspect-video overflow-hidden [container-type:size] sm:aspect-auto sm:h-[min(600px,calc(100svh-19rem))]">
        {/*
         * Every section's picture is stacked and kept loaded, so switching —
         * by hover or by the timer — slides at once instead of waiting for an
         * image. Only the incoming and outgoing pictures are animated.
         */}
        {portfolioCategories.map((category, index) => {
          const cover = covers[category.slug] ?? fallback;
          const visible = index === slide.active;
          const leaving = index === slide.leaving;
          const motion = visible
            ? slide.leaving === null ? "" : slide.dir === 1 ? "banner-in-next" : "banner-in-prev"
            : leaving ? (slide.dir === 1 ? "banner-out-next" : "banner-out-prev") : "invisible";
          return (
            <div
              key={category.slug}
              aria-hidden={!visible}
              className={`absolute inset-0 ${visible ? "z-10" : ""} ${motion}`}
            >
              {cover ? (
                // The box takes the picture's own proportions, as large as the
                // frame allows, so the light runs along the picture's edges and
                // not across the frame beside it.
                <div className="absolute inset-0 flex items-center justify-center">
                  <div
                    className="relative overflow-hidden"
                    style={{ aspectRatio: `${cover.width}/${cover.height}`, width: `min(100cqw, calc(100cqh * ${cover.width / cover.height}))` }}
                  >
                    <Picture asset={cover} fill priority={index === 0} sizes="(min-width: 1400px) 1100px, 100vw" alt={category.title} />
                    <EdgeLight edge="top" />
                    <EdgeLight edge="bottom" />
                  </div>
                </div>
              ) : (
                <div className="absolute inset-0 bg-[url('/portfolio-studio.webp')] bg-cover bg-center" role="img" aria-label={category.title} />
              )}
            </div>
          );
        })}
        {!shown && <p className="absolute inset-x-0 top-6 z-20 text-center font-display text-2xl font-bold text-white drop-shadow-lg sm:top-10 sm:text-5xl">{title(active)}</p>}
      </div>
      <nav aria-label="Portfolio bo‘limlari" className="grid grid-cols-2 gap-2 p-3 sm:grid-cols-4 sm:gap-3 sm:p-5">
        {portfolioCategories.map((category) => <Link key={category.slug} href={`/${locale}/portfolio/${category.slug}`}
          onMouseEnter={() => showSlug(category.slug)} onFocus={() => { showSlug(category.slug); setHeld(true); }} onBlur={() => setHeld(false)}
          aria-current={category.slug === active ? "true" : undefined}
          className={`flex min-h-12 items-center justify-center rounded-full border px-2 py-2 text-center text-[11px] font-bold leading-tight text-[#33243a] shadow-lg shadow-black/20 transition-[background-color,transform,box-shadow,border-color] duration-300 hover:-translate-y-1 hover:bg-white hover:shadow-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:min-h-14 sm:px-3 sm:text-sm ${category.slug === active ? "border-white bg-white" : "border-white/50 bg-[#f9c9b8]"}`}>
          {category.title}
        </Link>)}
      </nav>
    </div>
  </section>;
}
