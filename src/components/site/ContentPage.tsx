import { BlockRenderer } from "@/components/blocks/BlockRenderer";
import { Picture } from "@/components/media/Picture";
import type { PageDetail } from "@/lib/content/queries";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { BackLink } from "./BackLink";

/** Shared layout for the About page and custom "More" pages. */
export function ContentPage({ page, dict, locale }: { page: PageDetail; dict: Dictionary; locale: Locale }) {
  return (
    <article className="pb-24 pt-[calc(var(--header-h)+2.5rem)] sm:pb-32 sm:pt-[calc(var(--header-h)+4rem)]">
      <div className="animate-rise mx-auto mb-10 max-w-5xl px-5 sm:px-8">
        <BackLink fallback={`/${locale}`} label={dict.common.back} home={{ href: `/${locale}`, label: dict.nav.home }} />
      </div>
      <header className="mx-auto flex max-w-5xl flex-col items-center px-5 text-center sm:px-8">
        {page.image && (
          <div className="animate-rise relative mb-10 size-40 overflow-hidden rounded-full ring-1 ring-border ring-offset-4 ring-offset-bg sm:size-52">
            <Picture asset={page.image} alt={page.title} priority sizes="208px" fill />
          </div>
        )}
        <h1
          className="animate-rise font-display text-[clamp(2.25rem,6vw,4.5rem)] font-bold leading-[1.04] tracking-[-0.03em]"
          style={{ animationDelay: "0.06s" }}
        >
          {page.title}
        </h1>
        {page.excerpt && (
          <p
            className="animate-rise mt-6 max-w-2xl text-lg leading-relaxed text-muted sm:text-xl"
            style={{ animationDelay: "0.12s" }}
          >
            {page.excerpt}
          </p>
        )}
      </header>

      {page.blocks.length > 0 && (
        <div className="mx-auto mt-16 max-w-[1400px] px-5 sm:mt-20 sm:px-8">
          <BlockRenderer blocks={page.blocks} media={page.media} dict={dict} />
        </div>
      )}
    </article>
  );
}
