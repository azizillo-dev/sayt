import "server-only";
import type { Locale } from "@/lib/i18n/config";

/**
 * Machine translation for admin content. Runs once on save — translations are
 * stored in the database and remain editable, so visitors never wait on it.
 *
 * Uses the official Cloud Translation API when GOOGLE_TRANSLATE_API_KEY is set,
 * otherwise Google's public endpoint (no key, fine for low volume).
 */

const OFFICIAL_BATCH = 100;
const PUBLIC_CHUNK_ITEMS = 60;
const PUBLIC_CHUNK_CHARS = 4000;
const TIMEOUT_MS = 15_000;

async function translateOfficial(texts: string[], from: Locale, to: Locale, key: string): Promise<string[]> {
  const out: string[] = [];
  for (let i = 0; i < texts.length; i += OFFICIAL_BATCH) {
    const res = await fetch(`https://translation.googleapis.com/language/translate/v2?key=${key}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ q: texts.slice(i, i + OFFICIAL_BATCH), source: from, target: to, format: "text" }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) throw new Error(`Translation API ${res.status}`);
    const json = (await res.json()) as { data: { translations: { translatedText: string }[] } };
    out.push(...json.data.translations.map((t) => t.translatedText));
  }
  return out;
}

/** Splits texts into requests that stay well under the endpoint's size limit. */
function chunk(texts: string[]): string[][] {
  const chunks: string[][] = [];
  let current: string[] = [];
  let size = 0;
  for (const text of texts) {
    if (current.length && (size + text.length > PUBLIC_CHUNK_CHARS || current.length >= PUBLIC_CHUNK_ITEMS)) {
      chunks.push(current);
      current = [];
      size = 0;
    }
    current.push(text);
    size += text.length;
  }
  if (current.length) chunks.push(current);
  return chunks;
}

async function translateChunkPublic(texts: string[], from: Locale, to: Locale, attempt = 1): Promise<string[]> {
  const res = await fetch(`https://translate.googleapis.com/translate_a/t?client=gtx&sl=${from}&tl=${to}`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
    body: new URLSearchParams(texts.map((q) => ["q", q])),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (res.status === 429 && attempt < 3) {
    await new Promise((r) => setTimeout(r, 1000 * attempt));
    return translateChunkPublic(texts, from, to, attempt + 1);
  }
  if (!res.ok) throw new Error(`Translation endpoint ${res.status}`);

  // One string per input; some responses wrap each as [text, detectedLang].
  const json = (await res.json()) as (string | [string, string])[] | string;
  const items = Array.isArray(json) ? json : [json];
  if (items.length !== texts.length) throw new Error("Translation endpoint returned an unexpected shape");
  return items.map((item) => (Array.isArray(item) ? item[0] : item));
}

async function translatePublic(texts: string[], from: Locale, to: Locale): Promise<string[]> {
  const results: string[] = [];
  // Sequential: a burst of parallel requests is what triggers rate limiting.
  for (const part of chunk(texts)) results.push(...(await translateChunkPublic(part, from, to)));
  return results;
}

/** Translates a list of strings, preserving order. Blank strings pass through untouched. */
export async function translateTexts(texts: string[], from: Locale, to: Locale): Promise<string[]> {
  const pending = [...new Set(texts.filter((t) => t.trim()))];
  if (pending.length === 0) return texts;

  const key = process.env.GOOGLE_TRANSLATE_API_KEY;
  const translated = key ? await translateOfficial(pending, from, to, key) : await translatePublic(pending, from, to);

  const lookup = new Map(pending.map((text, i) => [text, translated[i] ?? text]));
  return texts.map((t) => lookup.get(t) ?? t);
}
