import { ArrowUpRight } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Reveal } from "@/components/motion/Reveal";
import { BackLink } from "@/components/site/BackLink";
import { PartnerLogo } from "@/components/site/PartnerLogo";
import { SectionHeader } from "@/components/site/SectionHeader";
import { resolveLocale } from "@/lib/content/navigation";
import { getPartners, type PartnerItem } from "@/lib/content/queries";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getSettings } from "@/lib/settings/service";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = await resolveLocale(params);
  return { title: getDictionary(locale).sections.allPartners };
}

const tileClass =
  "relative flex aspect-[3/2] items-center justify-center rounded-card border border-border bg-surface p-8 sm:p-10";

function PartnerTile({ partner, config }: { partner: PartnerItem; config: { grayscale: boolean; invertOnDark: boolean } }) {
  const logo = (
    <PartnerLogo partner={partner} grayscale={config.grayscale} invertOnDark={config.invertOnDark} className="h-full w-full" />
  );
  if (!partner.url) return <div className={tileClass}>{logo}</div>;

  return (
    <a
      href={partner.url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={partner.name}
      className={`${tileClass} group transition-[transform,border-color] duration-500 ease-out-expo hover:-translate-y-1 hover:border-accent`}
    >
      {logo}
      <ArrowUpRight className="absolute right-4 top-4 size-4 text-muted opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
    </a>
  );
}

export default async function PartnersPage({ params }: Props) {
  const locale = await resolveLocale(params);
  const settings = await getSettings();
  if (!settings.partners.enabled) notFound();

  const dict = getDictionary(locale);
  const partners = await getPartners();

  return (
    <section className="mx-auto max-w-[1400px] px-5 pb-24 pt-[calc(var(--header-h)+2.5rem)] sm:px-8 sm:pb-32 sm:pt-[calc(var(--header-h)+4rem)]">
      <div className="animate-rise mb-8">
        <BackLink fallback={`/${locale}`} label={dict.common.back} home={{ href: `/${locale}`, label: dict.nav.home }} />
      </div>
      <SectionHeader as="h1" title={dict.sections.allPartners} />
      <ul className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
        {partners.map((partner, i) => (
          <li key={partner.id}>
            <Reveal delay={(i % 4) * 0.05} y={16}>
              <PartnerTile partner={partner} config={settings.partners} />
            </Reveal>
          </li>
        ))}
      </ul>
    </section>
  );
}
