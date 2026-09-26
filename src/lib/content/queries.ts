import "server-only";
import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { cache } from "react";
import { db, schema } from "@/db";
import type { Block } from "@/lib/blocks/schema";
import { collectMediaIds } from "@/lib/blocks/utils";
import { defaultLocale, type Locale } from "@/lib/i18n/config";
import { getMediaMap } from "@/lib/media/service";
import type { MediaAsset, MediaMap } from "@/lib/media/types";

/**
 * Read-side queries for the public site. Each returns plain serialisable
 * objects with media already resolved, so components never touch the DB.
 * A missing translation falls back to the Uzbek source.
 */

interface TranslationRow {
  locale: Locale;
  title: string;
  excerpt: string;
  blocks: Block[];
}

function pick<T extends TranslationRow>(rows: T[], locale: Locale): T | undefined {
  const exact = rows.find((r) => r.locale === locale);
  return exact?.title.trim() ? exact : (rows.find((r) => r.locale === defaultLocale) ?? exact);
}

function localesFor(locale: Locale): Locale[] {
  return locale === defaultLocale ? [locale] : [locale, defaultLocale];
}

// ── Projects ─────────────────────────────────────────────────

export interface ProjectCard {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  cover: MediaAsset | null;
}

export interface ProjectDetail extends ProjectCard {
  blocks: Block[];
  media: MediaMap;
  next: Pick<ProjectCard, "slug" | "title" | "cover"> | null;
}

const projectOrder = [asc(schema.projects.sortOrder), desc(schema.projects.publishedAt)];

type ProjectWithBlocks = ProjectCard & { blocks: Block[] };

async function loadProjects(rows: (typeof schema.projects.$inferSelect)[], locale: Locale): Promise<ProjectWithBlocks[]> {
  if (rows.length === 0) return [];
  const [translations, media] = await Promise.all([
    db
      .select()
      .from(schema.projectTranslations)
      .where(
        and(
          inArray(
            schema.projectTranslations.projectId,
            rows.map((r) => r.id),
          ),
          inArray(schema.projectTranslations.locale, localesFor(locale)),
        ),
      ),
    getMediaMap(rows.map((r) => r.coverId)),
  ]);

  return rows.map((row) => {
    const t = pick(
      translations.filter((tr) => tr.projectId === row.id),
      locale,
    );
    return {
      id: row.id,
      slug: row.slug,
      title: t?.title ?? row.slug,
      excerpt: t?.excerpt ?? "",
      date: row.publishedAt,
      cover: row.coverId ? (media[row.coverId] ?? null) : null,
      blocks: t?.blocks ?? [],
    };
  });
}

const publishedProjects = cache(() =>
  db.select().from(schema.projects).where(eq(schema.projects.isPublished, true)).orderBy(...projectOrder),
);

export async function getProjectCards(
  locale: Locale,
  filter: { featuredOnly?: boolean; limit?: number } = {},
): Promise<{ items: ProjectCard[]; total: number }> {
  const all = await publishedProjects();
  const pool = filter.featuredOnly ? all.filter((p) => p.isFeatured) : all;
  const rows = filter.limit ? pool.slice(0, filter.limit) : pool;
  const projects = await loadProjects(rows, locale);
  return { items: projects.map(({ blocks: _blocks, ...card }) => card), total: all.length };
}

export const getProject = cache(async (locale: Locale, slug: string): Promise<ProjectDetail | null> => {
  const all = await publishedProjects();
  const index = all.findIndex((p) => p.slug === slug);
  const row = all[index];
  if (!row) return null;

  // "Next project" wraps around so the last one leads back to the first.
  const nextRow = all.length > 1 ? all[(index + 1) % all.length] : undefined;
  const [project, next] = (await loadProjects(nextRow ? [row, nextRow] : [row], locale)) as [
    ProjectWithBlocks,
    ProjectWithBlocks?,
  ];

  return {
    ...project,
    media: await getMediaMap(collectMediaIds(project.blocks)),
    next: next ? { slug: next.slug, title: next.title, cover: next.cover } : null,
  };
});

export async function getProjectSlugs(): Promise<string[]> {
  return (await publishedProjects()).map((p) => p.slug);
}

// ── Pages ────────────────────────────────────────────────────

export interface PageDetail {
  id: string;
  slug: string;
  kind: "about" | "custom";
  title: string;
  excerpt: string;
  blocks: Block[];
  image: MediaAsset | null;
  media: MediaMap;
}

export interface MenuPage {
  slug: string;
  title: string;
}

async function loadPage(where: ReturnType<typeof eq>, locale: Locale): Promise<PageDetail | null> {
  const row = await db.query.pages.findFirst({ where: and(where, eq(schema.pages.isPublished, true)) });
  if (!row) return null;

  const translations = await db
    .select()
    .from(schema.pageTranslations)
    .where(and(eq(schema.pageTranslations.pageId, row.id), inArray(schema.pageTranslations.locale, localesFor(locale))));
  const t = pick(translations, locale);
  const blocks = t?.blocks ?? [];
  const media = await getMediaMap([...collectMediaIds(blocks), row.imageId]);

  return {
    id: row.id,
    slug: row.slug,
    kind: row.kind,
    title: t?.title ?? "",
    excerpt: t?.excerpt ?? "",
    blocks,
    image: row.imageId ? (media[row.imageId] ?? null) : null,
    media,
  };
}

export const getAboutPage = cache((locale: Locale) => loadPage(eq(schema.pages.kind, "about"), locale));

export const getCustomPage = cache(async (locale: Locale, slug: string) => {
  const page = await loadPage(eq(schema.pages.slug, slug), locale);
  return page?.kind === "custom" ? page : null;
});

export async function getCustomPageSlugs(): Promise<string[]> {
  const rows = await db
    .select({ slug: schema.pages.slug })
    .from(schema.pages)
    .where(and(eq(schema.pages.kind, "custom"), eq(schema.pages.isPublished, true)));
  return rows.map((r) => r.slug);
}

export const getMenuPages = cache(async (locale: Locale): Promise<MenuPage[]> => {
  const rows = await db
    .select({
      id: schema.pages.id,
      slug: schema.pages.slug,
      locale: schema.pageTranslations.locale,
      title: schema.pageTranslations.title,
    })
    .from(schema.pages)
    .innerJoin(schema.pageTranslations, eq(schema.pageTranslations.pageId, schema.pages.id))
    .where(
      and(
        eq(schema.pages.kind, "custom"),
        eq(schema.pages.isPublished, true),
        eq(schema.pages.showInMenu, true),
        inArray(schema.pageTranslations.locale, localesFor(locale)),
      ),
    )
    .orderBy(asc(schema.pages.sortOrder));

  const seen = new Map<string, MenuPage>();
  for (const row of rows) {
    const current = seen.get(row.id);
    const preferred = row.locale === locale && row.title.trim();
    if (!current || preferred) seen.set(row.id, { slug: row.slug, title: row.title || row.slug });
  }
  return [...seen.values()];
});

// ── Partners & social ────────────────────────────────────────

export interface PartnerItem {
  id: string;
  name: string;
  url: string | null;
  showInMarquee: boolean;
  logo: MediaAsset | null;
}

export async function getPartners(filter: { marqueeOnly?: boolean; limit?: number } = {}): Promise<PartnerItem[]> {
  const rows = await db
    .select()
    .from(schema.partners)
    .where(filter.marqueeOnly ? eq(schema.partners.showInMarquee, true) : undefined)
    .orderBy(asc(schema.partners.sortOrder), asc(schema.partners.createdAt))
    .limit(filter.limit ?? 1000);
  const media = await getMediaMap(rows.map((r) => r.logoId));
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    url: r.url,
    showInMarquee: r.showInMarquee,
    logo: r.logoId ? (media[r.logoId] ?? null) : null,
  }));
}

export interface SocialItem {
  id: string;
  platform: string;
  label: string;
  url: string;
  icon: MediaAsset | null;
}

export const getSocialLinks = cache(async (): Promise<SocialItem[]> => {
  const rows = await db.select().from(schema.socialLinks).orderBy(asc(schema.socialLinks.sortOrder));
  const media = await getMediaMap(rows.map((r) => r.iconId));
  return rows.map((r) => ({
    id: r.id,
    platform: r.platform,
    label: r.label,
    url: r.url,
    icon: r.iconId ? (media[r.iconId] ?? null) : null,
  }));
});
