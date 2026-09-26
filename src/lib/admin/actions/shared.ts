import type { Locale } from "@/lib/i18n/config";

export function translationWarning(failed: Locale[]): string | undefined {
  if (failed.length === 0) return undefined;
  return `Saqlandi, lekin ${failed.map((l) => l.toUpperCase()).join(", ")} tarjimasi bajarilmadi — internetni tekshirib, qayta saqlang yoki qo'lda to'ldiring.`;
}
