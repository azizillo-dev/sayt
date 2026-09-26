"use client";

import { ArrowUp, Moon, Sun } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { scrollToTop } from "./SmoothScroll";
import { THEME_STORAGE_KEY } from "./ThemeScript";

const SHOW_TOP_AFTER = 480;
const TRANSITION_MS = 450;

type Mode = "light" | "dark";

const buttonClass =
  "grid size-12 place-items-center rounded-full border border-border bg-surface/85 text-fg shadow-lg shadow-black/5 backdrop-blur-xl transition-[transform,background-color] duration-300 hover:-translate-y-0.5 hover:bg-surface active:scale-95 sm:size-14";

export function FloatingActions({ labels }: { labels: { top: string; theme: string } }) {
  const [showTop, setShowTop] = useState(false);
  const [mode, setMode] = useState<Mode | null>(null);

  useEffect(() => {
    setMode(document.documentElement.dataset.theme === "dark" ? "dark" : "light");
    const onScroll = () => setShowTop(window.scrollY > SHOW_TOP_AFTER);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const toggleTheme = () => {
    const next: Mode = mode === "dark" ? "light" : "dark";
    const root = document.documentElement;
    // Cross-fade colours only during the switch, never during normal use.
    root.classList.add("theme-transition");
    root.dataset.theme = next;
    window.setTimeout(() => root.classList.remove("theme-transition"), TRANSITION_MS);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // private mode — the choice just won't persist
    }
    setMode(next);
  };

  return (
    <div className="fixed bottom-5 right-5 z-40 flex flex-col items-center gap-3 sm:bottom-8 sm:right-8">
      <AnimatePresence>
        {showTop && (
          <motion.button
            type="button"
            onClick={scrollToTop}
            aria-label={labels.top}
            className={buttonClass}
            initial={{ opacity: 0, y: 12, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.8 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          >
            <ArrowUp className="size-5" />
          </motion.button>
        )}
      </AnimatePresence>

      <button type="button" onClick={toggleTheme} aria-label={labels.theme} className={buttonClass}>
        {/* Icon is chosen after mount; the server cannot know the visitor's theme. */}
        <span className="relative size-5">
          <Sun
            className={`absolute inset-0 size-5 transition-all duration-500 ${mode === "dark" ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-50 opacity-0"}`}
          />
          <Moon
            className={`absolute inset-0 size-5 transition-all duration-500 ${mode === "light" ? "rotate-0 scale-100 opacity-100" : "rotate-90 scale-50 opacity-0"}`}
          />
        </span>
      </button>
    </div>
  );
}
