import "server-only";
import { and, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db, schema } from "@/db";
import type { NavLink } from "@/components/site/Header";
import { isLocale, type Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { SiteSettings } from "@/lib/settings/schema";
import { getMenuPages } from "./queries";

/** Validates the `[locale]` route param (the proxy already guarantees it, this narrows the type). */
export async function resolveLocale(params: Promise<{ locale: string }>): Promise<Locale> {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return locale;
}

async function hasPublishedAbout(): Promise<boolean> {
  const row = await db.query.pages.findFirst({
    where: and(eq(schema.pages.kind, "about"), eq(schema.pages.isPublished, true)),
    columns: { id: true },
  });
  return Boolean(row);
}

export async function buildNavigation(locale: Locale, settings: SiteSettings, dict: Dictionary) {
  const [aboutExists, pages] = await Promise.all([hasPublishedAbout(), getMenuPages(locale)]);

  const more: NavLink[] = [];
  if (!settings.projects.showAllOnHome) more.push({ href: `/${locale}/projects`, label: dict.nav.projects });
  if (settings.partners.enabled) more.push({ href: `/${locale}/partners`, label: dict.nav.partners });
  more.push(...pages.map((p) => ({ href: `/${locale}/${p.slug}`, label: p.title })));

  return {
    about: aboutExists ? { href: `/${locale}/about`, label: dict.nav.about } : null,
    more,
  };
}
