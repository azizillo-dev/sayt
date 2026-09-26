export const locales = ["uz", "ru", "en"] as const;
export type Locale = (typeof locales)[number];

/** Content is authored in this language; the others are translated from it. */
export const defaultLocale: Locale = "uz";

/** Remembers the visitor's language choice (set by the language switcher). */
export const LOCALE_COOKIE = "locale";
export const translatedLocales = locales.filter((l) => l !== defaultLocale);

export const localeLabels: Record<Locale, string> = {
  uz: "O'zbekcha",
  ru: "Русский",
  en: "English",
};

/** BCP-47 tags for Intl formatting and `<html lang>`. */
export const localeTags: Record<Locale, string> = {
  uz: "uz-Latn-UZ",
  ru: "ru-RU",
  en: "en-US",
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (locales as readonly string[]).includes(value);
}
