import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BackLink } from "@/components/site/BackLink";
import { ContactSection } from "@/components/site/ContactSection";
import { ProjectGrid } from "@/components/site/ProjectGrid";
import { SectionHeader } from "@/components/site/SectionHeader";
import { resolveLocale } from "@/lib/content/navigation";
import { getProjectCards } from "@/lib/content/queries";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getSettings } from "@/lib/settings/service";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = await resolveLocale(params);
  return { title: getDictionary(locale).sections.allProjects };
}

export default async function ProjectsPage({ params }: Props) {
  const locale = await resolveLocale(params);
  const settings = await getSettings();

  // With "show all on home" the separate page is switched off.
  if (settings.projects.showAllOnHome) redirect(`/${locale}#work`);

  const dict = getDictionary(locale);
  const { items } = await getProjectCards(locale);

  return (
    <>
      <section className="mx-auto max-w-[1400px] px-5 pb-16 pt-[calc(var(--header-h)+2.5rem)] sm:px-8 sm:pt-[calc(var(--header-h)+4rem)]">
        <div className="animate-rise mb-8">
          <BackLink fallback={`/${locale}`} label={dict.common.back} home={{ href: `/${locale}`, label: dict.nav.home }} />
        </div>
        <SectionHeader as="h1" title={dict.sections.allProjects} />
        <ProjectGrid
          projects={items}
          locale={locale}
          viewLabel={dict.common.view}
          emptyLabel={dict.empty.projects}
          priorityCount={2}
        />
      </section>
      <ContactSection
        locale={locale}
        title={settings.contact.title[locale]}
        subtitle={settings.contact.subtitle[locale]}
        dict={dict}
      />
    </>
  );
}
