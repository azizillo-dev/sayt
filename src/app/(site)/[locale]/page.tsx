import { ClientsSection } from "@/components/site/ClientsSection";
import { ContactSection } from "@/components/site/ContactSection";
import { Hero } from "@/components/site/Hero";
import { HeroProfile } from "@/components/site/HeroProfile";
import { PortfolioCategories } from "@/components/site/PortfolioCategories";
import { SectionHeader } from "@/components/site/SectionHeader";
import { StatementSection } from "@/components/site/StatementSection";
import { VideoCard } from "@/components/site/VideoCard";
import { resolveLocale } from "@/lib/content/navigation";
import { getPartners } from "@/lib/content/queries";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getMediaMap } from "@/lib/media/service";
import type { MediaAsset, MediaMap } from "@/lib/media/types";
import { getSettings } from "@/lib/settings/service";
import { getVideos } from "@/lib/videos/queries";

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = await resolveLocale(params);
  const dict = getDictionary(locale);
  const settings = await getSettings();
  const { hero, clients, statement, partners: partnerConfig } = settings;

  const [portfolioMedia, heroMedia, videos, clientLogos] = await Promise.all([
    getMediaMap([settings.portfolio.coverId, ...Object.values(settings.portfolio.covers)]),
    hero.layout === "profile" ? getMediaMap([hero.photoId, hero.backgroundId]) : Promise.resolve<MediaMap>({}),
    getVideos({ limit: 5 }),
    clients.enabled && clients.logoCount > 0 ? getPartners({ marqueeOnly: true, limit: clients.logoCount }) : [],
  ]);
  /** The hero's backdrop, reused by the blocks below it so the page reads as one piece. */
  const backdrop = hero.backgroundId ? (heroMedia[hero.backgroundId] ?? null) : null;

  const available = hero.available ? hero.availableText[locale] : null;
  const cta = { work: dict.hero.work, contact: dict.hero.contact };

  return (
    <>
      {hero.layout === "profile" ? (
        <HeroProfile
          name={hero.name[locale].trim() || settings.brand.name}
          role={hero.role[locale]}
          photo={hero.photoId ? (heroMedia[hero.photoId] ?? null) : null}
          columns={hero.columns.map((column) => ({
            title: column.title[locale],
            // Stored as one text area; each line becomes a list entry.
            items: column.items[locale].split("\n").map((line) => line.trim()).filter(Boolean),
          }))}
          tagline={hero.tagline[locale]}
          available={available}
          cta={cta}
          gradient={hero.gradient}
          background={backdrop}
          blendPhoto={hero.photoBlend}
        />
      ) : (
        <Hero title={hero.title[locale]} subtitle={hero.subtitle[locale]} available={available} cta={cta} />
      )}

      {clients.enabled && (
        <ClientsSection
          count={clients.count}
          title={clients.title[locale]}
          text={clients.text[locale]}
          partners={clientLogos}
          more={partnerConfig.enabled ? { href: `/${locale}/partners`, label: clients.moreLabel[locale] } : null}
          background={backdrop}
          gradient={hero.gradient}
        />
      )}

      <PortfolioCategories locale={locale} covers={Object.fromEntries(
        Object.entries(settings.portfolio.covers).map(([key, id]) => [key, id ? portfolioMedia[id] ?? null : null]),
      ) as Record<keyof typeof settings.portfolio.covers, MediaAsset | null>} fallback={settings.portfolio.coverId ? portfolioMedia[settings.portfolio.coverId] ?? null : null} />

      {statement.enabled && (
        <StatementSection
          word={statement.word[locale]}
          headline={statement.headline[locale]}
          text={statement.text[locale]}
          steps={statement.steps[locale]}
          background={backdrop}
          gradient={hero.gradient}
        />
      )}

      {videos.length > 0 && <section id="videos" className="mx-auto max-w-[1400px] scroll-mt-24 px-5 py-16 sm:px-8 sm:py-24">
        <SectionHeader title={dict.videos.title} action={{ href: `/${locale}/videos`, label: dict.common.viewAll }} />
        <div className="flex flex-wrap justify-center gap-3 sm:gap-5">{videos.map((item) => <div key={item.id} className="w-[calc(50%-0.375rem)] sm:w-[calc(33.333%-0.875rem)] lg:w-[calc(25%-1rem)]"><VideoCard item={item} locale={locale} /></div>)}</div>
      </section>}

      <ContactSection
        locale={locale}
        title={settings.contact.title[locale]}
        subtitle={settings.contact.subtitle[locale]}
        dict={dict}
      />
    </>
  );
}
