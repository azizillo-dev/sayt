import {
  siBehance,
  siDribbble,
  siFacebook,
  siFigma,
  siGithub,
  siInstagram,
  siPinterest,
  siTelegram,
  siThreads,
  siTiktok,
  siVk,
  siWhatsapp,
  siX,
  siYoutube,
} from "simple-icons";

export interface BrandPlatform {
  label: string;
  /** Brand colour, used on hover. */
  color: string;
  /** 24×24 SVG path. */
  path: string;
}

// LinkedIn was removed from simple-icons for trademark reasons; this is the
// standard 24×24 glyph.
const linkedinPath =
  "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 1 1 0-4.125 2.062 2.062 0 0 1 0 4.125zM7.119 20.452H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z";

const brand = (icon: { title: string; hex: string; path: string }, label = icon.title): BrandPlatform => ({
  label,
  color: `#${icon.hex}`,
  path: icon.path,
});

export const brandPlatforms = {
  telegram: brand(siTelegram),
  instagram: brand(siInstagram),
  behance: brand(siBehance),
  dribbble: brand(siDribbble),
  linkedin: { label: "LinkedIn", color: "#0A66C2", path: linkedinPath },
  youtube: brand(siYoutube),
  tiktok: brand(siTiktok, "TikTok"),
  x: brand(siX, "X"),
  facebook: brand(siFacebook),
  threads: brand(siThreads),
  pinterest: brand(siPinterest),
  figma: brand(siFigma),
  github: brand(siGithub, "GitHub"),
  whatsapp: brand(siWhatsapp, "WhatsApp"),
  vk: brand(siVk, "VK"),
} satisfies Record<string, BrandPlatform>;

/** Non-brand contact methods, drawn with lucide icons. */
export const genericPlatforms = {
  email: { label: "Email" },
  phone: { label: "Telefon" },
  website: { label: "Veb-sayt" },
  custom: { label: "Boshqa (o'z ikonkasi)" },
} as const;

export type BrandKey = keyof typeof brandPlatforms;
export type PlatformKey = BrandKey | keyof typeof genericPlatforms;

export const platformOptions: { key: PlatformKey; label: string }[] = [
  ...Object.entries(brandPlatforms).map(([key, p]) => ({ key: key as PlatformKey, label: p.label })),
  ...Object.entries(genericPlatforms).map(([key, p]) => ({ key: key as PlatformKey, label: p.label })),
];

export function isBrand(key: string): key is BrandKey {
  return key in brandPlatforms;
}

/** Turns what the admin typed into a clickable href (mailto:, tel:, https://). */
export function socialHref(platform: string, value: string): string {
  const v = value.trim();
  if (platform === "email") return v.startsWith("mailto:") ? v : `mailto:${v}`;
  if (platform === "phone") return v.startsWith("tel:") ? v : `tel:${v.replace(/[^\d+]/g, "")}`;
  return /^https?:\/\//i.test(v) ? v : `https://${v}`;
}
