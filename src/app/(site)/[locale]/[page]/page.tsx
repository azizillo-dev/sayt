import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ContentPage } from "@/components/site/ContentPage";
import { resolveLocale } from "@/lib/content/navigation";
import { getCustomPage, getCustomPageSlugs } from "@/lib/content/queries";
import { getDictionary } from "@/lib/i18n/dictionaries";

type Props = { params: Promise<{ locale: string; page: string }> };

// Pre-render published pages; pages created later render once and are then cached.
export async function generateStaticParams() {
  return (await getCustomPageSlugs()).map((page) => ({ page }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const page = await getCustomPage(locale, (await params).page);
  return page ? { title: page.title, description: page.excerpt } : {};
}

export default async function CustomPage({ params }: Props) {
  const locale = await resolveLocale(params);
  const page = await getCustomPage(locale, (await params).page);
  if (!page) notFound();
  return <ContentPage page={page} dict={getDictionary(locale)} locale={locale} />;
}
