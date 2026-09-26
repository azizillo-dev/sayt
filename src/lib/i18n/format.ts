import { localeTags, type Locale } from "./config";

// Intl has patchy Uzbek month names across runtimes, so they are spelled out here.
const uzMonths = ["yan", "fev", "mar", "apr", "may", "iyun", "iyul", "avg", "sen", "okt", "noy", "dek"];

/** "18-sen, 2026" / "18 сент. 2026 г." / "Sep 18, 2026" */
export function formatDate(date: Date | string, locale: Locale): string {
  const d = typeof date === "string" ? new Date(date) : date;
  if (locale === "uz") {
    return `${d.getUTCDate()}-${uzMonths[d.getUTCMonth()]}, ${d.getUTCFullYear()}`;
  }
  return new Intl.DateTimeFormat(localeTags[locale], {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(d);
}
