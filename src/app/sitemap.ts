import type { MetadataRoute } from "next";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { getProjectSlugs } from "@/lib/content/queries";
import { locales, localeTags } from "@/lib/i18n/config";
import { getSettings } from "@/lib/settings/service";

// Rebuilt at most hourly, so new projects appear without a redeploy.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = (process.env.SITE_URL ?? "http://localhost:3000").replace(/\/+$/, "");
  const [settings, projectSlugs, pages] = await Promise.all([
    getSettings(),
    getProjectSlugs(),
    db.select({ slug: schema.pages.slug }).from(schema.pages).where(eq(schema.pages.isPublished, true)),
  ]);

  const paths = [
    "",
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
