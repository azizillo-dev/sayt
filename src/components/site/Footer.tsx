import type { CSSProperties } from "react";
import { platformColor, SocialIcon } from "@/components/icons/SocialIcon";
import type { SocialItem } from "@/lib/content/queries";
import { brandPlatforms, isBrand, socialHref } from "@/lib/social/platforms";

interface Props {
  brand: string;
  socials: SocialItem[];
  labels: { follow: string; rights: string };
}

export function Footer({ brand, socials, labels }: Props) {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-[1400px] flex-col items-center px-5 py-16 text-center sm:px-8 sm:py-20">
        {socials.length > 0 && (
          <>
            <h2 className="font-display text-xl font-semibold sm:text-2xl">{labels.follow}</h2>
            <ul className="mt-8 flex flex-wrap justify-center gap-3 sm:gap-4">
              {socials.map((s) => {
                const name = s.label || (isBrand(s.platform) ? brandPlatforms[s.platform].label : s.platform);
                const external = s.platform !== "email" && s.platform !== "phone";
                return (
                  <li key={s.id}>
                    <a
                      href={socialHref(s.platform, s.url)}
                      aria-label={name}
                      title={name}
                      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                      style={{ "--brand": platformColor(s.platform) ?? "var(--fg)" } as CSSProperties}
                      className="grid size-16 place-items-center rounded-card-sm border border-border bg-surface text-[var(--brand)] transition-[transform,border-color] duration-300 hover:-translate-y-1 hover:border-[var(--brand)] sm:size-20"
                    >
                      <SocialIcon platform={s.platform} icon={s.icon} className="size-6 sm:size-7" />
                    </a>
                  </li>
                );
              })}
            </ul>
          </>
        )}
        <p className={socials.length > 0 ? "mt-12 text-sm text-muted" : "text-sm text-muted"}>
          © {year} {brand}. {labels.rights}
        </p>
      </div>
    </footer>
  );
}
