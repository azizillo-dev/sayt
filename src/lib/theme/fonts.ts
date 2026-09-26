/**
 * Curated font list. Every family supports Latin + Cyrillic so all three
 * site languages render in the chosen face. The actual `next/font` loaders
 * live in `src/app/fonts.ts`; this module only holds serialisable metadata
 * so it can be imported from client components and zod schemas.
 */
export const fontKeys = ["manrope", "inter", "onest", "montserrat", "unbounded", "playfair"] as const;
export type FontKey = (typeof fontKeys)[number];

export const fontLabels: Record<FontKey, string> = {
  manrope: "Manrope",
  inter: "Inter",
  onest: "Onest",
  montserrat: "Montserrat",
  unbounded: "Unbounded",
  playfair: "Playfair Display",
};

export function fontVar(key: FontKey): string {
  return `var(--font-${key})`;
}
