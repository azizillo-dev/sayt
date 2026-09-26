import "server-only";
import type { Block } from "@/lib/blocks/schema";
import { mapBlockTexts } from "@/lib/blocks/utils";
import { defaultLocale, translatedLocales, type Locale } from "@/lib/i18n/config";
import type { Localized } from "@/lib/settings/schema";
import { translateTexts } from "@/lib/translate";

export interface LocalizedDoc {
  title: string;
  excerpt: string;
  blocks: Block[];
}

export type LocalizedDocs = Record<Locale, LocalizedDoc>;

function isEmptyDoc(doc: LocalizedDoc): boolean {
  return !doc.title.trim() && !doc.excerpt.trim() && doc.blocks.length === 0;
}

async function translateDoc(source: LocalizedDoc, to: Locale): Promise<LocalizedDoc> {
  const texts: string[] = [source.title, source.excerpt];
  mapBlockTexts(source.blocks, (t) => (texts.push(t), t));

  const translated = await translateTexts(texts, defaultLocale, to);
  let i = 2;
  return {
    title: translated[0]!,
    excerpt: translated[1]!,
    blocks: mapBlockTexts(source.blocks, () => translated[i++]!),
  };
}

/**
 * Fills the non-default languages from the Uzbek source: empty ones always,
 * all of them when `force` is set (the "I changed the Uzbek text" checkbox).
 * A failed translation keeps the existing text instead of failing the save.
 */
export async function autoTranslateDocs(docs: LocalizedDocs, force: boolean): Promise<{ docs: LocalizedDocs; failed: Locale[] }> {
  const source = docs[defaultLocale];
  const result = { ...docs };
  const failed: Locale[] = [];

  await Promise.all(
    translatedLocales.map(async (locale) => {
      if (!force && !isEmptyDoc(docs[locale])) return;
      try {
        result[locale] = await translateDoc(source, locale);
      } catch (error) {
        console.error(`[translate] ${locale} failed`, error);
        failed.push(locale);
      }
    }),
  );
  return { docs: result, failed };
}

/**
 * Same rule for settings strings (hero title, contact text…), but for the whole
 * form at once: one request per language instead of one per field, which is
 * what keeps the free endpoint from rate-limiting a save.
 *
 * Multi-line values are translated line by line, so their structure survives.
 */
export async function autoTranslateBundle<K extends string>(
  values: Record<K, Localized>,
  force: boolean,
): Promise<Record<K, Localized>> {
  const result = { ...values };
  const keys = Object.keys(values) as K[];

  await Promise.all(
    translatedLocales.map(async (locale) => {
      const pending = keys.filter((key) => force || !values[key][locale].trim());
      const lines = pending.map((key) => values[key][defaultLocale].split("\n"));
      if (lines.every((l) => l.every((line) => !line.trim()))) return;

      try {
        const translated = await translateTexts(lines.flat(), defaultLocale, locale);
        let taken = 0;
        pending.forEach((key, i) => {
          const count = lines[i]!.length;
          result[key] = { ...result[key], [locale]: translated.slice(taken, taken + count).join("\n") };
          taken += count;
        });
      } catch (error) {
        console.error(`[translate] ${locale} failed`, error);
      }
    }),
  );
  return result;
}
