"use client";

import type { Theme } from "@/lib/theme/schema";

export const THEME_STORAGE_KEY = "theme";

/**
 * Runs before first paint (inline in <head>) and sets `data-theme` on <html>,
 * so a dark-mode visitor never sees a white flash. Order of preference:
 * the visitor's saved choice → admin default → OS setting.
 *
 * The server emits an executable script. If React ever re-creates the element
 * on the client it gets `type="text/plain"`: the script already ran, and React
 * treats non-JS scripts as data blocks instead of warning about them.
 */
export function ThemeScript({ defaultMode }: { defaultMode: Theme["defaultMode"] }) {
  const script = `(function(){var d=document.documentElement,m=${JSON.stringify(defaultMode)};try{var s=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});if(s==="light"||s==="dark")m=s}catch(e){}if(m==="system")m=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";d.dataset.theme=m})()`;
  return (
    <script
      suppressHydrationWarning
      type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
      dangerouslySetInnerHTML={{ __html: script }}
    />
  );
}
