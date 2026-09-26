import { fontVar } from "./fonts";
import type { Palette, Theme } from "./schema";

function paletteVars(p: Palette): string {
  return [
    `--bg:${p.background}`,
    `--surface:${p.surface}`,
    `--fg:${p.text}`,
    `--muted:${p.muted}`,
    `--border:${p.border}`,
    `--accent:${p.accent}`,
    `--accent-fg:${p.accentText}`,
  ].join(";");
}

/**
 * Serialises the admin-controlled theme into CSS custom properties.
 * Injected into <head> on the server so the first paint already has the
 * right colours — no flash while JS loads. Values are validated hex/enum
 * strings (see themeSchema), so this is safe to inline.
 */
export function themeToCss(theme: Theme): string {
  const shared = [
    `--ff-body:${fontVar(theme.fontBody)}`,
    `--ff-display:${fontVar(theme.fontDisplay)}`,
    `--radius:${theme.radius}px`,
  ].join(";");

  return [
    `:root{${shared};${paletteVars(theme.light)};color-scheme:light}`,
    `:root[data-theme=dark]{${paletteVars(theme.dark)};color-scheme:dark}`,
  ].join("");
}
