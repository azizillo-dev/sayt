import { Picture } from "@/components/media/Picture";
import type { PartnerItem } from "@/lib/content/queries";
import { cn } from "@/lib/cn";

interface Props {
  partner: PartnerItem;
  grayscale: boolean;
  invertOnDark: boolean;
  eager?: boolean;
  className?: string;
}

/** Logo fitted inside a fixed box, so every brand gets the same visual weight. */
export function PartnerLogo({ partner, grayscale, invertOnDark, eager, className }: Props) {
  return (
    <div
      className={cn(
        "flex items-center justify-center transition-[filter,opacity] duration-500",
        grayscale && "opacity-60 grayscale hover:opacity-100 hover:grayscale-0",
        invertOnDark && "dark:invert",
        className,
      )}
    >
      {partner.logo ? (
        <Picture
          asset={partner.logo}
          alt={partner.name}
          sizes="200px"
          loading={eager ? "eager" : undefined}
          bare
          className="h-full w-full"
          imgClassName="h-full w-full object-contain"
        />
      ) : (
        <span className="font-display text-lg font-bold tracking-tight">{partner.name}</span>
      )}
    </div>
  );
}
