import { ArrowDown } from "lucide-react";
import type { CSSProperties } from "react";
import { Picture } from "@/components/media/Picture";
import type { MediaAsset } from "@/lib/media/types";
import { heroBackground } from "@/lib/settings/hero";
import { cn } from "@/lib/cn";

export interface HeroFacts {
  title: string;
  items: string[];
}

interface Props {
  name: string;
  role: string;
  photo: MediaAsset | null;
  columns: HeroFacts[];
  tagline: string;
  available: string | null;
  cta: { work: string; contact: string };
  gradient: { from: string; via: string; to: string; label: string };
  /** Fade the photo's edge into the gradient — essential for rectangular photos. */
  blendPhoto: boolean;
}

/** Horizontal padding is shared by the text blocks the photo sits between. */
const PAD = "px-6 sm:px-9 lg:px-14";

/**
 * The designer's calling card: portrait on the right, name and facts on a
 * gradient. Everything — text, photo, colours — comes from the admin panel.
 *
 * The entrance is CSS-only (`animate-rise`), so it plays before hydration.
 */
export function HeroProfile({ name, role, photo, columns, tagline, available, cta, gradient, blendPhoto }: Props) {
  const facts = columns.filter((c) => c.title.trim() || c.items.length);

  return (
    <section className="mx-auto max-w-[1400px] px-5 pt-[calc(var(--header-h)+0.75rem)] sm:px-8">
      <div
        className={cn(
          "animate-rise relative isolate flex flex-col overflow-hidden rounded-card",
          // A portrait needs the full height; without one the card only needs its text.
          photo ? "min-h-[34rem] lg:min-h-[min(44rem,calc(100svh-var(--header-h)-2rem))]" : "lg:min-h-[32rem]",
        )}
        style={{ background: heroBackground(gradient) }}
      >
        {/* Without a photo the text simply uses the full card. */}
        <div className={cn(PAD, "relative z-10 pt-7 sm:pt-9 lg:pt-12", photo && "lg:max-w-[62%]")}>
          {available && (
            <p className="animate-rise mb-7 inline-flex items-center gap-2.5 rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-[13px] font-medium text-white backdrop-blur-sm">
              <span className="relative flex size-2">
                <span className="animate-pulse-ring absolute inset-0 rounded-full bg-emerald-400" />
                <span className="relative size-2 rounded-full bg-emerald-400" />
              </span>
              {available}
            </p>
          )}

          {/*
           * Sized in px and vw, never rem: a phone set to a large system font
           * would otherwise blow the name past the card. `break-words` is the
           * last resort for a surname longer than any line.
           */}
          <h1
            className="animate-rise break-words font-display text-[clamp(24px,7.6vw,68px)] font-bold leading-[1.03] tracking-[-0.035em] text-white"
            style={{ animationDelay: "0.06s" }}
          >
            {name}
          </h1>

          {role && (
            <p
              className="animate-rise mt-3 max-w-md text-[clamp(15px,1.5vw,21px)] font-semibold leading-snug"
              style={{ animationDelay: "0.12s", color: gradient.label }}
            >
              {role}
            </p>
          )}
        </div>

        {photo && (
          <div
            /*
             * The box always takes the photo's own aspect ratio — stacked it is
             * centred and capped, beside the text it is sized from the card's
             * height. Nothing is ever cropped, so the blend fades the photo's
             * real edges instead of empty space.
             */
            style={{ "--hero-photo-ratio": `${photo.width}/${photo.height}` } as CSSProperties}
            className={cn(
              // Full card width when stacked: the photo's own background then
              // lines up with the card's gradient instead of cutting across it.
              "relative mx-auto mt-1 aspect-[var(--hero-photo-ratio)] w-full max-w-[22rem]",
              "lg:absolute lg:bottom-0 lg:right-0 lg:top-auto lg:z-0 lg:mx-0 lg:mt-0 lg:h-[92%] lg:w-auto lg:max-w-[52%]",
              blendPhoto && "hero-photo-blend",
            )}
          >
            <Picture
              asset={photo}
              alt={name}
              fill
              bare
              priority
              sizes="(min-width: 1024px) 46vw, 100vw"
              imgClassName="object-bottom"
            />
          </div>
        )}

        {/*
         * Sits after the photo in the source: stacked on a phone the portrait
         * follows the name, while beside the text the photo is taken out of the
         * flow and these columns land straight under the role, as in the brief.
         */}
        {facts.length > 0 && (
          <div
            className={cn(PAD, "animate-rise relative z-10 mt-8 sm:mt-9 lg:mt-10", photo && "lg:max-w-[62%]")}
            style={{ animationDelay: "0.2s" }}
          >
            <div className="flex flex-wrap gap-x-6 gap-y-5 sm:gap-x-7">
              {facts.map((column, i) => (
                <div
                  key={i}
                  className="min-w-[8rem] flex-1 sm:border-l sm:border-white/25 sm:pl-6 sm:first:border-l-0 sm:first:pl-0"
                >
                  {column.title && (
                    <p className="text-[13px] font-bold sm:text-sm" style={{ color: gradient.label }}>
                      {column.title}
                    </p>
                  )}
                  <ul className="mt-1.5 space-y-1 text-[13.5px] leading-snug text-white/90 sm:text-[15px]">
                    {column.items.map((item, j) => (
                      <li key={j}>{item}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className={cn(PAD, "relative z-10 mt-auto pb-7 pt-8 sm:pb-9 lg:pb-12", photo && "lg:max-w-[62%]")}>
          <div
            className="animate-rise flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"
            style={{ animationDelay: "0.28s" }}
          >
            {tagline && (
              <p className="font-display text-xl font-bold tracking-tight text-white sm:text-2xl lg:text-[1.75rem]">{tagline}</p>
            )}
            <div className="flex shrink-0 gap-3">
              <a
                href="#work"
                className="group inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-[15px] font-semibold text-neutral-900 transition-transform duration-300 hover:scale-[1.03]"
              >
                {cta.work}
                <ArrowDown className="size-4 transition-transform duration-300 group-hover:translate-y-0.5" />
              </a>
              <a
                href="#contact"
                className="inline-flex items-center rounded-full border border-white/45 px-5 py-2.5 text-[15px] font-semibold text-white transition-colors duration-300 hover:bg-white/15"
              >
                {cta.contact}
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
