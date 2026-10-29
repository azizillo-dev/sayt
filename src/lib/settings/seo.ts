import type { Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import type { SiteSettings } from "./schema";

/**
 * What search engines show for the site. People look for "dizayner", not for
 * the brand, so when the admin leaves the SEO fields empty the title and
 * description are built around the designer's name and profession.
 */
export function siteSeo(settings: SiteSettings, locale: Locale) {
  const dict = getDictionary(locale).seo;
  const name = settings.hero.name[locale].trim() || settings.brand.name;
  const fill = (template: string) => template.replaceAll("{name}", name);
  return {
    name,
    jobTitle: dict.jobTitle,
    title: settings.seo.title[locale].trim() || fill(dict.title),
    description: settings.seo.description[locale].trim() || fill(dict.description),
  };
}
