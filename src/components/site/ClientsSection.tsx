import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Picture } from "@/components/media/Picture";
import type { PartnerItem } from "@/lib/content/queries";
import type { MediaAsset } from "@/lib/media/types";
import { heroBackground } from "@/lib/settings/hero";
import type { SiteSettings } from "@/lib/settings/schema";

interface Props {
  count: string;
  title: string;
  text: string;
  /** First partners, shown as logo tiles. */
  partners: PartnerItem[];
  /** The last tile, to the full partners page; null when that page is off. */
  more: { href: string; label: string } | null;
  /** Same backdrop as the hero, so the two read as one piece. */
  background: MediaAsset | null;
  gradient: SiteSettings["hero"]["gradient"];
}

/** Tile height; widths follow from the logo strip and the fixed last tile. */
const TILE = "flex h-20 items-center justify-center rounded-2xl shadow-[0_14px_30px_-18px_rgba(0,0,0,.6)] sm:h-28";
/** Seconds each logo takes to cross its own width — sets the strip's speed. */
const SECONDS_PER_LOGO = 3;
/** The strip is repeated until it is at least this long, so it never shows a gap. */
const MIN_STRIP = 10;

/** "50+ projects" with the companies behind them — trust, right after the hero. */
export function ClientsSection({ count, title, text, partners, more, background, gradient }: Props) {
  return (
    <section className="mx-auto max-w-[1400px] px-5 pt-5 sm:px-8 sm:pt-6">
      <div
        className="relative isolate overflow-hidden rounded-card px-5 py-7 sm:px-9 sm:py-10 lg:px-14"
        style={background ? undefined : { background: heroBackground(gradient) }}
      >
        {background && (
          <Picture asset={background} fill sizes="(min-width: 1400px) 1336px, 100vw" alt="" className="-z-10" />
        )}
        {/* Keeps the white text readable on the light end of the backdrop. */}
        <div aria-hidden className="absolute inset-0 -z-10 bg-[#0d1433]/45" />

        <div className="flex flex-col gap-3 rounded-2xl bg-[#3b3f7f]/80 px-5 py-5 backdrop-blur-sm sm:flex-row sm:items-center sm:gap-7 sm:px-8 sm:py-6">
          <p className="shrink-0 font-display text-[clamp(52px,9vw,104px)] font-bold leading-none tracking-[-0.04em] text-white">
            {count}
          </p>
          <div className="min-w-0 text-white">
            <h2 className="font-display text-lg font-bold leading-tight sm:text-2xl">{title}</h2>
            {text && <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/85 sm:text-[15px]">{text}</p>}
          </div>
        </div>

        {more && (
          <div className="mt-5 flex justify-end sm:mt-6">
            {/* "View All" stays in English in every language — the client asked for it. */}
            <Link
              href={more.href}
              className="group inline-flex items-center gap-1.5 text-sm font-semibold text-white/85 transition-colors hover:text-white sm:text-[15px]"
            >
              View All
              <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </div>
        )}

        <div className="mt-3 flex gap-3 sm:gap-4">
          {partners.length > 0 && <LogoStrip partners={partners} />}
          {more && (
            <Link
              href={more.href}
              className={`${TILE} w-24 shrink-0 bg-[#363b88] px-2 text-center font-display text-sm font-bold text-white transition-[background-color,transform] duration-300 hover:-translate-y-1 hover:bg-[#4249a3] sm:w-44 sm:text-xl`}
            >
              {more.label}
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}

/**
 * Partner logos drifting left without end, in their own colours. The list is
 * repeated to fill the strip, then doubled so the loop seam is invisible:
 * the track moves by exactly half its length and starts over.
 */
function LogoStrip({ partners }: { partners: PartnerItem[] }) {
  const copies = Math.ceil(MIN_STRIP / partners.length);
  const strip = Array.from({ length: copies }, () => partners).flat();
  return (
    <div className="min-w-0 flex-1 overflow-hidden [mask-image:linear-gradient(to_right,transparent,#000_6%,#000_94%,transparent)]">
      <ul
        className="marquee-track flex w-max gap-3 sm:gap-4"
        style={{ ["--marquee-duration" as string]: `${strip.length * SECONDS_PER_LOGO}s` }}
      >
        {[...strip, ...strip].map((partner, i) => (
          // The second half only repeats the first, so it is hidden from screen readers.
          <li
            key={i}
            aria-hidden={i >= strip.length || undefined}
            title={partner.name}
            className={`${TILE} w-32 shrink-0 bg-white px-4 sm:w-48 sm:px-6`}
          >
            {partner.logo ? (
              <Picture asset={partner.logo} alt={partner.name} sizes="192px" loading="eager" bare className="h-3/4 w-full" imgClassName="h-full w-full object-contain" />
            ) : (
              <span className="text-center font-display text-base font-bold text-[#1d2251] sm:text-lg">{partner.name}</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
