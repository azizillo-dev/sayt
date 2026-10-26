import { Picture } from "@/components/media/Picture";
import type { MediaAsset } from "@/lib/media/types";
import { heroBackground } from "@/lib/settings/hero";
import type { SiteSettings } from "@/lib/settings/schema";

interface Props {
  word: string;
  headline: string;
  text: string;
  /** "Maqsad → G'oya → …": the designer's process in one line. */
  steps: string;
  /** Same backdrop as the hero, so the page reads as one piece. */
  background: MediaAsset | null;
  gradient: SiteSettings["hero"]["gradient"];
}

/** One big word and what it means to this designer — a beat before the videos. */
export function StatementSection({ word, headline, text, steps, background, gradient }: Props) {
  return (
    <section className="mx-auto max-w-[1400px] px-5 pt-6 sm:px-8">
      <div
        className="relative isolate flex flex-col gap-4 overflow-hidden rounded-card px-6 py-7 text-white sm:flex-row sm:items-center sm:gap-8 sm:px-10 sm:py-9 lg:px-14"
        style={background ? undefined : { background: heroBackground(gradient) }}
      >
        {background && <Picture asset={background} fill sizes="(min-width: 1400px) 1336px, 100vw" alt="" className="-z-10" />}
        {/* Keeps the white type readable over the light end of the backdrop. */}
        <div aria-hidden className="absolute inset-0 -z-10 bg-[#0d1433]/35" />

        <p
          aria-hidden="true"
          className="shrink-0 font-[family-name:var(--font-condensed)] text-[clamp(64px,13vw,150px)] font-bold uppercase leading-[0.85] tracking-[-0.01em]"
        >
          {word}
        </p>
        <div className="min-w-0">
          <h2 className="font-display text-base font-bold uppercase leading-snug tracking-tight sm:text-xl lg:text-2xl">
            <span className="sr-only">{word} — </span>
            {headline}
          </h2>
          {text && <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/90 sm:text-base lg:text-lg">{text}</p>}
          {steps && <p className="mt-3 font-display text-sm font-bold sm:text-base lg:text-lg">{steps}</p>}
        </div>
      </div>
    </section>
  );
}
