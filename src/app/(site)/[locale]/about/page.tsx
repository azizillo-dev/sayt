import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ContentPage } from "@/components/site/ContentPage";
import { resolveLocale } from "@/lib/content/navigation";
import { getAboutPage } from "@/lib/content/queries";
import { getDictionary } from "@/lib/i18n/dictionaries";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const page = await getAboutPage(await resolveLocale(params));
  return page ? { title: page.title, description: page.excerpt } : {};
}

export default async function AboutPage({ params }: Props) {
  const locale = await resolveLocale(params);
  const page = await getAboutPage(locale);
  if (!page) notFound();
  return <ContentPage page={page} dict={getDictionary(locale)} locale={locale} />;
}
