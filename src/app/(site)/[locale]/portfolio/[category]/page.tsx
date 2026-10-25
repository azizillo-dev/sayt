import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Picture } from "@/components/media/Picture";
import { BackLink } from "@/components/site/BackLink";
import { resolveLocale } from "@/lib/content/navigation";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getPortfolioCategory, portfolioCategories } from "@/lib/portfolio/categories";
import { getPortfolioItems } from "@/lib/portfolio/queries";

type Props = { params: Promise<{ locale: string; category: string }> };

export function generateStaticParams() {
  return portfolioCategories.map((category) => ({ category: category.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const category = getPortfolioCategory((await params).category);
  return { title: category ? `${category.title} | Portfolio` : "Portfolio" };
}

export default async function PortfolioCategoryPage({ params }: Props) {
  const locale = await resolveLocale(params);
  const category = getPortfolioCategory((await params).category);
  if (!category) notFound();
  const items = await getPortfolioItems(category.slug);
  const dict = getDictionary(locale);
  return <section className="min-h-[75dvh] overflow-hidden pb-20 pt-[calc(var(--header-h)+2rem)] sm:pt-[calc(var(--header-h)+3rem)]">
    <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
      <BackLink fallback={`/${locale}#work`} label={dict.common.back} home={{ href: `/${locale}`, label: dict.nav.home }} />
      <div className="mx-auto mt-8 max-w-4xl text-center sm:mt-6">
        <p className="text-xs font-bold uppercase tracking-[0.27em] text-accent">Portfolio / {category.number}</p>
        <h1 className="mt-3 font-display text-[clamp(2rem,6vw,4rem)] font-bold leading-tight tracking-tight">{category.title}</h1>
        <p className="mt-4 text-sm text-muted sm:text-base">{dict.portfolio.pickWork}</p>
      </div>
    </div>
    {items.length ? <div className="mx-auto mt-10 grid max-w-[1400px] gap-4 px-5 sm:grid-cols-2 sm:gap-6 sm:px-8 lg:grid-cols-4">
      {items.map((item) => <Link key={item.id} href={`/${locale}/portfolio/${category.slug}/${item.id}`} className="group min-w-0 overflow-hidden rounded-2xl border border-border bg-surface shadow-[0_20px_50px_-35px_rgba(0,0,0,.6)] transition-transform duration-300 hover:-translate-y-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
        <div className="relative aspect-[4/5] overflow-hidden bg-bg"><Picture asset={item.cover} fill fit="cover" sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw" imgClassName="transition-transform duration-500 group-hover:scale-[1.035]" /></div>
        <div className="flex items-center justify-between gap-3 p-4 sm:p-5"><h2 className="min-w-0 text-base font-semibold leading-tight sm:text-lg">{item.title}</h2><ArrowUpRight className="size-5 shrink-0 text-muted transition-colors group-hover:text-accent" /></div>
      </Link>)}
    </div> : <p className="mx-auto max-w-xl px-5 py-24 text-center text-muted">{dict.portfolio.empty}</p>}
  </section>;
}
