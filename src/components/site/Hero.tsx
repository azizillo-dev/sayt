import { ArrowDown } from "lucide-react";
import { Fragment, type CSSProperties } from "react";

interface Props {
  title: string;
  subtitle: string;
  available: string | null;
  cta: { work: string; contact: string } | null;
}

const STAGGER_S = 0.06;
const delay = (seconds: number) => ({ animationDelay: `${seconds}s` }) as CSSProperties;

/** Words rise in one after another. Pure CSS, so it plays even before hydration. */
export function Hero({ title, subtitle, available, cta }: Props) {
  const words = title.split(/\s+/).filter(Boolean);
  const afterTitle = words.length * STAGGER_S + 0.15;

  return (
    <section className="mx-auto flex min-h-[78svh] max-w-[1400px] flex-col justify-end px-5 pb-16 pt-[calc(var(--header-h)+4rem)] sm:px-8 sm:pb-24">
      {available && (
        <p className="animate-rise mb-8 inline-flex items-center gap-2.5 self-start rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium">
          <span className="relative flex size-2">
            <span className="animate-pulse-ring absolute inset-0 rounded-full bg-emerald-500" />
            <span className="relative size-2 rounded-full bg-emerald-500" />
          </span>
          {available}
        </p>
      )}

      <h1 className="max-w-[16ch] font-display text-[clamp(2.75rem,8.5vw,8.5rem)] font-bold leading-[0.95] tracking-[-0.035em]">
        {words.map((word, i) => (
          <Fragment key={i}>
            {i > 0 && " "}
            <span className="animate-rise inline-block" style={delay(0.05 + i * STAGGER_S)}>
              {word}
            </span>
          </Fragment>
        ))}
      </h1>

      <div className="mt-10 flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
        {subtitle && (
          <p className="animate-rise max-w-xl text-lg leading-relaxed text-muted sm:text-xl" style={delay(afterTitle)}>
            {subtitle}
          </p>
        )}
        {cta && (
          <div className="animate-rise flex shrink-0 gap-3" style={delay(afterTitle + 0.1)}>
            <a
              href="#work"
              className="group inline-flex items-center gap-2 rounded-full bg-fg px-5 py-2.5 text-[15px] font-semibold text-bg transition-transform duration-300 hover:scale-[1.03]"
            >
              {cta.work}
              <ArrowDown className="size-4 transition-transform duration-300 group-hover:translate-y-0.5" />
            </a>
            <a
              href="#contact"
              className="inline-flex items-center rounded-full border border-fg/25 px-5 py-2.5 text-[15px] font-semibold transition-colors duration-300 hover:border-fg/50 hover:bg-surface"
            >
              {cta.contact}
            </a>
          </div>
        )}
      </div>
    </section>
  );
}
