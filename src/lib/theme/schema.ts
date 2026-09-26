import { z } from "zod";
import { fontKeys } from "./fonts";

export const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/, "HEX rang kerak, masalan #1a1a1a");
const hex = hexColor;

export const paletteKeys = ["background", "surface", "text", "muted", "border", "accent", "accentText"] as const;
export type PaletteKey = (typeof paletteKeys)[number];

export const paletteSchema = z.object({
  background: hex,
  surface: hex,
  text: hex,
  muted: hex,
  border: hex,
  accent: hex,
  accentText: hex,
});
export type Palette = z.infer<typeof paletteSchema>;

export const themeSchema = z.object({
  light: paletteSchema,
  dark: paletteSchema,
  fontBody: z.enum(fontKeys),
  fontDisplay: z.enum(fontKeys),
  /** Card / button corner radius in px. */
  radius: z.number().int().min(0).max(40),
  /** Colour scheme for first-time visitors. */
  defaultMode: z.enum(["system", "light", "dark"]),
});
export type Theme = z.infer<typeof themeSchema>;

export const defaultTheme: Theme = {
  light: {
    background: "#f7f6f3",
    surface: "#ffffff",
    text: "#141414",
    muted: "#62615d",
    border: "#e4e2dc",
    accent: "#5b4cf0",
    accentText: "#ffffff",
  },
  dark: {
    background: "#0c0d10",
    surface: "#16171c",
    text: "#f2f2f0",
    muted: "#9a9ba3",
    border: "#26272e",
    accent: "#9d8cff",
    accentText: "#0c0d10",
  },
  fontBody: "manrope",
  fontDisplay: "manrope",
  radius: 20,
  defaultMode: "system",
};

export const themePresets: { name: string; theme: Theme }[] = [
  { name: "Lavanda", theme: defaultTheme },
  {
    name: "Monoxrom",
    theme: {
      ...defaultTheme,
      light: { ...defaultTheme.light, accent: "#111111", accentText: "#ffffff" },
      dark: { ...defaultTheme.dark, background: "#000000", surface: "#111111", accent: "#ffffff", accentText: "#000000" },
      radius: 4,
    },
  },
  {
    name: "Terrakota",
    theme: {
      ...defaultTheme,
      light: { ...defaultTheme.light, background: "#f4efe7", accent: "#c4532f" },
      dark: { ...defaultTheme.dark, background: "#14110f", surface: "#1e1a17", border: "#2e2824", accent: "#f08a5d" },
      fontDisplay: "playfair",
    },
  },
  {
    name: "Neon",
    theme: {
      ...defaultTheme,
      light: { ...defaultTheme.light, accent: "#0a7d52" },
      dark: { ...defaultTheme.dark, accent: "#c6ff3d", accentText: "#0c0d10" },
      fontDisplay: "unbounded",
      radius: 28,
    },
  },
];
