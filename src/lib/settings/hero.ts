import type { SiteSettings } from "./schema";

/**
 * The profile hero's layered background. Shared by the site and the admin
 * preview, so what the designer picks is exactly what visitors see.
 */
export function heroBackground(gradient: SiteSettings["hero"]["gradient"]): string {
  return [
    // Keeps the text corner readable whatever colours are chosen.
    "radial-gradient(ellipse 70% 85% at 0% 0%, rgba(0,0,0,0.30), transparent 62%)",
    // Light behind the portrait.
    "radial-gradient(ellipse 66% 60% at 74% 24%, rgba(255,255,255,0.22), transparent 62%)",
    `linear-gradient(112deg, ${gradient.from} 0%, ${gradient.via} 40%, ${gradient.to} 92%)`,
  ].join(", ");
}
