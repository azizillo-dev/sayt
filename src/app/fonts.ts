import { Inter, Manrope, Montserrat, Onest, Playfair_Display, Unbounded } from "next/font/google";
import type { FontKey } from "@/lib/theme/fonts";

/**
 * Every selectable font is self-hosted by next/font. Only the default face is
 * preloaded; the browser downloads the others only if the theme uses them,
 * because unused @font-face rules are never fetched.
 * (next/font requires literal options, hence the repetition.)
 */
const manrope = Manrope({ subsets: ["latin", "latin-ext", "cyrillic"], variable: "--font-manrope", display: "swap" });
const inter = Inter({
  subsets: ["latin", "latin-ext", "cyrillic"],
  variable: "--font-inter",
  display: "swap",
  preload: false,
});
const onest = Onest({
  subsets: ["latin", "latin-ext", "cyrillic"],
  variable: "--font-onest",
  display: "swap",
  preload: false,
});
const montserrat = Montserrat({
  subsets: ["latin", "latin-ext", "cyrillic"],
  variable: "--font-montserrat",
  display: "swap",
  preload: false,
});
const unbounded = Unbounded({
  subsets: ["latin", "latin-ext", "cyrillic"],
  variable: "--font-unbounded",
  display: "swap",
  preload: false,
});
const playfair = Playfair_Display({
  subsets: ["latin", "latin-ext", "cyrillic"],
  variable: "--font-playfair",
  display: "swap",
  preload: false,
});

const fonts: Record<FontKey, { variable: string }> = { manrope, inter, onest, montserrat, unbounded, playfair };

/** Class names that define every `--font-*` variable. */
export const fontVariables = Object.values(fonts)
  .map((f) => f.variable)
  .join(" ");
