import { ContactSection } from "@/components/site/ContactSection";
import { Hero } from "@/components/site/Hero";
import { HeroProfile } from "@/components/site/HeroProfile";
import { PartnersMarquee } from "@/components/site/PartnersMarquee";
import { ProjectGrid } from "@/components/site/ProjectGrid";
import { SectionHeader } from "@/components/site/SectionHeader";
import { resolveLocale } from "@/lib/content/navigation";
import { getPartners, getProjectCards } from "@/lib/content/queries";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getMediaMap } from "@/lib/media/service";
import type { MediaMap } from "@/lib/media/types";
import { getSettings } from "@/lib/settings/service";

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = await resolveLocale(params);
  const dict = getDictionary(locale);
  const settings = await getSettings();
  const { hero, projects: projectConfig, partners: partnerConfig } = settings;

  const [projects, marquee, heroMedia] = await Promise.all([
    getProjectCards(
      locale,
      projectConfig.showAllOnHome ? {} : { featuredOnly: true, limit: projectConfig.featuredLimit },
    ),
    partnerConfig.enabled ? getPartners({ marqueeOnly: true, limit: partnerConfig.marqueeCount }) : [],
    hero.layout === "profile" ? getMediaMap([hero.photoId]) : Promise.resolve<MediaMap>({}),
  ]);

  const showProjectsLink = !projectConfig.showAllOnHome && projects.total > projects.items.length;
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
          blendPhoto={hero.photoBlend}
        />
      ) : (
        <Hero title={hero.title[locale]} subtitle={hero.subtitle[locale]} available={available} cta={cta} />
      )}

      <section id="work" className="mx-auto max-w-[1400px] scroll-mt-24 px-5 py-16 sm:px-8 sm:py-24">
        <SectionHeader
          title={projectConfig.showAllOnHome ? dict.sections.allProjects : dict.sections.selectedWork}
          action={showProjectsLink ? { href: `/${locale}/projects`, label: dict.common.viewAll } : null}
        />
        <ProjectGrid
          projects={projects.items}
          locale={locale}
          viewLabel={dict.common.view}
          emptyLabel={dict.empty.projects}
        />
      </section>

      {marquee.length > 0 && (
        <section className="py-16 sm:py-24">
          <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
            {/* "View All" stays in English in every language — the client asked for it. */}
            <SectionHeader title={dict.sections.partners} action={{ href: `/${locale}/partners`, label: "View All" }} />
          </div>
          <PartnersMarquee partners={marquee} config={partnerConfig} />
        </section>
      )}

      <ContactSection
        locale={locale}
        title={settings.contact.title[locale]}
        subtitle={settings.contact.subtitle[locale]}
        dict={dict}
      />
    </>
  );
}
