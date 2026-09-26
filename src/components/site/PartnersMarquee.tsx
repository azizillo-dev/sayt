import type { CSSProperties } from "react";
import type { PartnerItem } from "@/lib/content/queries";
import type { SiteSettings } from "@/lib/settings/schema";
import { PartnerLogo } from "./PartnerLogo";

/** Each slot is a fixed width, which lets the loop duration be computed exactly. */
const SLOT_PX = 236;
/** Repeat short lists until one copy is wider than any screen, so no gap ever appears. */
const MIN_SET_PX = 2400;

interface Props {
  partners: PartnerItem[];
  config: SiteSettings["partners"];
}

/**
 * Endless logo strip. Animated purely in CSS on the compositor (translate3d),
 * so it costs no JavaScript. Logos here are not links by design — the
 * "all partners" page carries the links.
 */
export function PartnersMarquee({ partners, config }: Props) {
  if (partners.length === 0) return null;

  const repeats = Math.max(1, Math.ceil(MIN_SET_PX / (partners.length * SLOT_PX)));
  const set = Array.from({ length: repeats }, () => partners).flat();
  const setWidth = set.length * SLOT_PX;

  const style = {
    "--marquee-duration": `${setWidth / config.speed}s`,
    "--marquee-direction": config.direction === "left" ? "normal" : "reverse",
  } as CSSProperties;

  return (
    <div className="marquee marquee-mask overflow-hidden" data-pause={config.pauseOnHover} style={style}>
      <div className="marquee-track flex w-max">
        {[0, 1].map((copy) => (
          // The second copy is decorative — hide it from screen readers.
          <ul key={copy} className="flex" aria-hidden={copy === 1 || undefined}>
            {set.map((partner, i) => (
              <li key={`${partner.id}-${i}`} className="shrink-0 px-3" style={{ width: SLOT_PX }}>
                <div className="flex h-24 items-center justify-center rounded-card border border-border bg-surface px-6 sm:h-28">
                  <PartnerLogo
                    partner={partner}
                    grayscale={config.grayscale}
                    invertOnDark={config.invertOnDark}
                    eager
                    className="h-10 w-full sm:h-12"
                  />
                </div>
              </li>
            ))}
          </ul>
        ))}
      </div>
    </div>
  );
}
