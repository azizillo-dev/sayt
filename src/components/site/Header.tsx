"use client";

import { ChevronDown } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { LOCALE_COOKIE, locales, type Locale } from "@/lib/i18n/config";
import { cn } from "@/lib/cn";

export interface NavLink {
  href: string;
  label: string;
}

interface Props {
  locale: Locale;
  brand: string;
  about: NavLink | null;
  more: NavLink[];
  labels: { more: string; language: string };
}

const HIDE_AFTER = 160;

export function Header({ locale, brand, about, more, labels }: Props) {
  const pathname = usePathname();
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Hide while scrolling down, reveal on the slightest scroll up.
  useEffect(() => {
    let last = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 8);
      if (Math.abs(y - last) < 6) return;
      setHidden(y > last && y > HIDE_AFTER);
      last = y;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setMenuOpen(false), [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const onPointer = (e: PointerEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false);
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  const switchLocale = (target: Locale) => {
    document.cookie = `${LOCALE_COOKIE}=${target};path=/;max-age=31536000;samesite=lax`;
  };
  const localizedPath = (target: Locale) => pathname.replace(/^\/[a-z]{2}(?=\/|$)/, `/${target}`);
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-[transform,background-color,border-color] duration-500 ease-out-expo",
        hidden && !menuOpen ? "-translate-y-full" : "translate-y-0",
        scrolled ? "border-b border-border/60 bg-bg/70 backdrop-blur-xl backdrop-saturate-150" : "border-b border-transparent",
      )}
    >
      <nav className="mx-auto flex h-[var(--header-h)] max-w-[1400px] items-center justify-between px-5 sm:px-8">
        <Link
          href={`/${locale}`}
          // `whitespace-nowrap`: a two-word brand must not break across two lines.
          className="shrink-0 whitespace-nowrap font-display text-lg font-bold tracking-tight transition-opacity hover:opacity-70 sm:text-[1.375rem]"
        >
          {brand}
        </Link>

        <div className="flex min-w-0 items-center gap-0.5 sm:gap-2">
          {about && (
            <Link
              href={about.href}
              className={cn(
                "rounded-full px-3.5 py-2 text-[0.95rem] font-semibold transition-colors hover:bg-surface",
                isActive(about.href) && "bg-surface",
              )}
            >
              {about.label}
            </Link>
          )}

          <div ref={menuRef} className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              aria-expanded={menuOpen}
              aria-haspopup="menu"
              className={cn(
                "flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[0.95rem] font-semibold transition-colors hover:bg-surface",
                menuOpen && "bg-surface",
              )}
            >
              {labels.more}
              <ChevronDown className={cn("size-4 transition-transform duration-300", menuOpen && "rotate-180")} />
            </button>

            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  role="menu"
                  initial={{ opacity: 0, y: -8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.98 }}
                  transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                  style={{ transformOrigin: "top right" }}
                  className="absolute right-0 top-full mt-2 w-64 rounded-card border border-border bg-surface p-2 shadow-2xl shadow-black/10"
                >
                  {more.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      role="menuitem"
                      className={cn(
                        "block rounded-card-sm px-3.5 py-2.5 font-medium transition-colors hover:bg-bg",
                        isActive(link.href) && "text-accent",
                      )}
                    >
                      {link.label}
                    </Link>
                  ))}

                  <div className={cn("grid grid-cols-3 gap-1", more.length > 0 && "mt-2 border-t border-border pt-2")}>
                    {locales.map((l) => (
                      <Link
                        key={l}
                        href={localizedPath(l)}
                        onClick={() => switchLocale(l)}
                        aria-label={`${labels.language}: ${l.toUpperCase()}`}
                        aria-current={l === locale ? "true" : undefined}
                        className={cn(
                          "rounded-card-sm py-2 text-center text-sm font-bold transition-colors",
                          l === locale ? "bg-accent text-accent-fg" : "text-muted hover:bg-bg hover:text-fg",
                        )}
                      >
                        {l.toUpperCase()}
                      </Link>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </nav>
    </header>
  );
}
