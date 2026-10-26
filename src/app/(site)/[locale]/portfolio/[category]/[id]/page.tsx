import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BackLink } from "@/components/site/BackLink";
import { PortfolioCarousel } from "@/components/site/PortfolioCarousel";
import { PortfolioWorkView } from "@/components/site/PortfolioWorkView";
import { resolveLocale } from "@/lib/content/navigation";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getPortfolioCategory } from "@/lib/portfolio/categories";
import { getPortfolioItems } from "@/lib/portfolio/queries";

type Props = { params: Promise<{ locale: string; category: string; id: string }> };

/** The one section whose works are browsed in the side-scrolling carousel. */
const CAROUSEL_SECTION = "social-media";

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
  const item = items[initialIndex]!;
  const dict = getDictionary(locale);
  const labels = { ...dict.portfolio, close: dict.common.close };
  const back = <BackLink fallback={`/${locale}/portfolio/${group.slug}`} label={dict.common.back} home={{ href: `/${locale}`, label: dict.nav.home }} />;

  // Every section but Social Media opens a work as its own page.
  if (group.slug !== CAROUSEL_SECTION) {
    return (
      <section className="pt-[calc(var(--header-h)+1.5rem)]">
        <div className="mx-auto max-w-[1400px] px-5 sm:px-8">{back}</div>
        <PortfolioWorkView
          item={item}
          others={items.filter((other) => other.id !== item.id)}
          categoryTitle={group.title}
          basePath={`/${locale}/portfolio/${group.slug}`}
          labels={labels}
        />
      </section>
    );
  }

  // Social Media: the work's own posts, side by side — the cover first, as on the list.
  const images = [item.cover, ...item.gallery.filter((asset) => asset.id !== item.cover.id)];
  return <section className="min-h-[80dvh] overflow-hidden pt-[calc(var(--header-h)+2rem)]">
    <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
      {back}
      <div className="mx-auto mt-8 max-w-3xl text-center sm:mt-6">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-accent">{group.title}</p>
        <h1 className="mt-3 font-display text-[clamp(1.75rem,5vw,3.25rem)] font-bold leading-tight tracking-tight">{item.title}</h1>
      </div>
    </div>
    <PortfolioCarousel images={images} title={item.title} labels={labels} />
  </section>;
}
