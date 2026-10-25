import type { MetadataRoute } from "next";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { getProjectSlugs } from "@/lib/content/queries";
import { locales, localeTags } from "@/lib/i18n/config";
import { getSettings } from "@/lib/settings/service";
import { portfolioCategories } from "@/lib/portfolio/categories";

// Rebuilt at most hourly, so new projects appear without a redeploy.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = (process.env.SITE_URL ?? "http://localhost:3000").replace(/\/+$/, "");
  const [settings, projectSlugs, pages, portfolioWorks, videos] = await Promise.all([
    getSettings(),
    getProjectSlugs(),
    db.select({ slug: schema.pages.slug }).from(schema.pages).where(eq(schema.pages.isPublished, true)),
    db.select({ id: schema.portfolioItems.id, category: schema.portfolioItems.category }).from(schema.portfolioItems).where(eq(schema.portfolioItems.isPublished, true)),
    db.select({ id: schema.videoItems.id }).from(schema.videoItems).where(eq(schema.videoItems.isPublished, true)),
  ]);

  const paths = [
    "",
    ...portfolioCategories.map((category) => `/portfolio/${category.slug}`),
    ...portfolioWorks.filter((item) => portfolioCategories.some((category) => category.slug === item.category)).map((item) => `/portfolio/${item.category}/${item.id}`),
    ...(videos.length ? ["/videos", ...videos.map((video) => `/videos/${video.id}`)] : []),
    ...(settings.projects.showAllOnHome ? [] : ["/projects"]),
    ...(settings.partners.enabled ? ["/partners"] : []),
    ...pages.map((p) => `/${p.slug}`),
    ...projectSlugs.map((slug) => `/projects/${slug}`),
  ];

  return paths.map((path) => ({
    url: `${base}/${locales[0]}${path}`,
    alternates: {
      languages: Object.fromEntries(locales.map((l) => [localeTags[l], `${base}/${l}${path}`])),
    },
  }));
}
