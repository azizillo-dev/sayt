"use client";

import Lenis from "lenis";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { recordPageView } from "@/lib/client-history";

let instance: Lenis | null = null;

/** Scrolls with Lenis when active, otherwise natively. */
export function scrollToTop() {
  if (instance) instance.scrollTo(0, { duration: 1.2 });
  else window.scrollTo({ top: 0, behavior: "smooth" });
}

/**
 * Inertia scrolling for mouse wheels on desktop. Touch devices keep their
 * native scrolling (Lenis leaves touch alone by default), and it is fully
 * disabled for visitors who prefer reduced motion.
 */
export function SmoothScroll() {
  const pathname = usePathname();

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // `anchors` makes in-page links (#work, #contact) glide instead of jump.
    instance = new Lenis({ lerp: 0.1, autoRaf: true, anchors: { offset: -24 } });
    return () => {
      instance?.destroy();
      instance = null;
    };
  }, []);

  // Next.js handles scroll position itself (top on push, restored on back).
  useEffect(() => {
    recordPageView();
  }, [pathname]);

  return null;
}
