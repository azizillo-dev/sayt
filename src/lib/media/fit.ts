/**
 * Keeping media inside the screen.
 *
 * Images keep their own aspect ratio, so a tall one rendered at the full
 * column width grows taller than the window — the visitor sees a fragment
 * and has to scroll to understand a single picture.
 *
 * Capping the *height* alone would letterbox the box (the element stays
 * full width while the pixels shrink), so instead the width is capped to
 * whatever keeps the height within `maxHeight`. Because the ratio is known
 * at render time, this is one CSS declaration — no measuring, no jumping.
 */
export function widthForHeight(asset: { width: number; height: number }, maxHeight: string): string {
  const ratio = asset.height > 0 ? asset.width / asset.height : 1;
  return `calc(${ratio.toFixed(4)} * ${maxHeight})`;
}

/**
 * Height cap for media in the flow of a project: fits the screen, hints at more below.
 *
 * `svh`, not `dvh`: on phones `dvh` changes as the address bar hides, which
 * would resize the image mid-scroll.
 */
export const CONTENT_MAX_H = "78svh";

/** Slightly shorter for the cover, so the article underneath is visible too. */
export const COVER_MAX_H = "72svh";
