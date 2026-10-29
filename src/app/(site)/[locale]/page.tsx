import type { Metadata } from "next";
import { ClientsSection } from "@/components/site/ClientsSection";
import { ContactSection } from "@/components/site/ContactSection";
import { Hero } from "@/components/site/Hero";
import { HeroProfile } from "@/components/site/HeroProfile";
import { PortfolioCategories } from "@/components/site/PortfolioCategories";
import { SectionHeader } from "@/components/site/SectionHeader";
import { StatementSection } from "@/components/site/StatementSection";
import { VideoCard } from "@/components/site/VideoCard";
import { resolveLocale } from "@/lib/content/navigation";
import { getPartners, getSocialLinks } from "@/lib/content/queries";
import { locales, localeTags } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getMediaMap } from "@/lib/media/service";
import type { MediaAsset, MediaMap } from "@/lib/media/types";
import { siteSeo } from "@/lib/settings/seo";
import { getSettings } from "@/lib/settings/service";
import { getVideos } from "@/lib/videos/queries";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const locale = await resolveLocale(params);
  return {
    alternates: {
      canonical: `/${locale}`,
      languages: { ...Object.fromEntries(locales.map((l) => [localeTags[l], `/${l}`])), "x-default": `/${locales[0]}` },
    },
  };
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = await resolveLocale(params);
  const dict = getDictionary(locale);
  const settings = await getSettings();
  const { hero, clients, statement, partners: partnerConfig } = settings;

  const [portfolioMedia, heroMedia, videos, clientLogos, socials] = await Promise.all([
    getMediaMap([settings.portfolio.coverId, ...Object.values(settings.portfolio.covers)]),
    hero.layout === "profile" ? getMediaMap([hero.photoId, hero.backgroundId]) : Promise.resolve<MediaMap>({}),
    getVideos({ limit: 5 }),
    clients.enabled && clients.logoCount > 0 ? getPartners({ marqueeOnly: true, limit: clients.logoCount }) : [],
    getSocialLinks(),
  ]);
  /** The hero's backdrop, reused by the blocks below it so the page reads as one piece. */
  const backdrop = hero.backgroundId ? (heroMedia[hero.backgroundId] ?? null) : null;

  const available = hero.available ? hero.availableText[locale] : null;
  const cta = { work: dict.hero.work, contact: dict.hero.contact };

  const photo = hero.photoId ? (heroMedia[hero.photoId] ?? null) : null;
  const base = (process.env.SITE_URL ?? "http://localhost:3000").replace(/\/+$/, "");
  const seo = siteSeo(settings, locale);
  /** Tells search engines who the site is about — a designer, with these specialities and profiles. */
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Person",
        "@id": `${base}/#person`,
        name: seo.name,
        alternateName: [...new Set([...locales.map((l) => hero.name[l].trim()), settings.brand.name])].filter((n) => n && n !== seo.name),
        jobTitle: seo.jobTitle,
        description: seo.description,
        url: `${base}/${locale}`,
        ...(photo ? { image: new URL(photo.url, base).href } : {}),
        knowsAbout: hero.columns[0]?.items[locale].split("\n").map((line) => line.trim()).filter(Boolean) ?? [],
        sameAs: socials.map((s) => s.url).filter((url) => /^https?:\/\//.test(url)),
      },
      {
        "@type": "WebSite",
        "@id": `${base}/#website`,
        name: settings.brand.name,
        url: base,
        inLanguage: locales.map((l) => localeTags[l]),
        about: { "@id": `${base}/#person` },
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        // "<" is escaped so no text from the settings can close the script tag.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }}
      />
      {hero.layout === "profile" ? (
        <HeroProfile
          name={hero.name[locale].trim() || settings.brand.name}
          role={hero.role[locale]}
          photo={photo}
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
