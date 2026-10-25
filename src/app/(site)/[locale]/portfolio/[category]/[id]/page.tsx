import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BackLink } from "@/components/site/BackLink";
import { PortfolioCarousel } from "@/components/site/PortfolioCarousel";
import { resolveLocale } from "@/lib/content/navigation";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getPortfolioCategory } from "@/lib/portfolio/categories";
import { getPortfolioItems } from "@/lib/portfolio/queries";

type Props = { params: Promise<{ locale: string; category: string; id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category, id } = await params;
  const group = getPortfolioCategory(category);
  if (!group) return { title: "Portfolio" };
  const item = (await getPortfolioItems(group.slug)).find((entry) => entry.id === id);
  return { title: item ? `${item.title} | ${group.title}` : group.title };
}

export default async function PortfolioItemPage({ params }: Props) {
  const locale = await resolveLocale(params);
  const { category, id } = await params;
  const group = getPortfolioCategory(category);
  if (!group) notFound();
  const items = await getPortfolioItems(group.slug);
  const initialIndex = items.findIndex((item) => item.id === id);
  if (initialIndex < 0) notFound();
  const dict = getDictionary(locale);

  return <section className="min-h-[80dvh] overflow-hidden pt-[calc(var(--header-h)+2rem)]">
    <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
      <BackLink fallback={`/${locale}/portfolio/${group.slug}`} label={dict.common.back} home={{ href: `/${locale}`, label: dict.nav.home }} />
      <div className="mx-auto mt-8 max-w-3xl text-center sm:mt-6">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-accent">Portfolio / {group.number}</p>
        <h1 className="mt-3 font-display text-[clamp(2rem,6vw,4rem)] font-bold leading-tight tracking-tight">{group.title}</h1>
      </div>
    </div>
    <PortfolioCarousel items={items} initialIndex={initialIndex} labels={{ ...dict.portfolio, close: dict.common.close }} />
  </section>;
}
