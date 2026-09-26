import { Globe, Link2, Mail, Phone } from "lucide-react";
import { brandPlatforms, isBrand } from "@/lib/social/platforms";
import { contrastRatio } from "@/lib/theme/color";
import type { MediaAsset } from "@/lib/media/types";

interface Props {
  platform: string;
  icon?: MediaAsset | null;
  className?: string;
}

export function SocialIcon({ platform, icon, className = "size-6" }: Props) {
  if (isBrand(platform)) {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
        <path d={brandPlatforms[platform].path} />
      </svg>
    );
  }
  if (platform === "custom" && icon) {
    return <img src={icon.url} alt="" width={24} height={24} className={`${className} object-contain`} />;
  }
  const Lucide = platform === "email" ? Mail : platform === "phone" ? Phone : platform === "website" ? Globe : Link2;
  return <Lucide className={className} aria-hidden="true" strokeWidth={1.75} />;
}

/**
 * Brand colour for the icon, or `undefined` for near-black brands (X, GitHub,
 * TikTok…) which would vanish in dark mode — those use the text colour.
 */
export function platformColor(platform: string): string | undefined {
  if (!isBrand(platform)) return undefined;
  const color = brandPlatforms[platform].color;
  return contrastRatio(color, "#000000") < 2.5 ? undefined : color;
}
