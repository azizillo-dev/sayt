/**
 * Freezes the page behind a full-screen layer and returns the undo.
 *
 * The page reserves its scrollbar gutter (`scrollbar-gutter: stable` in
 * globals.css) so content never shifts; a fixed layer cannot cover that
 * strip, which would show as a pale band down the right edge. Dropping the
 * reservation while locked lets the layer reach the edge — the reflow
 * underneath is hidden by the layer itself.
 */
export function lockPageScroll(): () => void {
  const root = document.documentElement;
  const { overflow, scrollbarGutter } = root.style;
  root.style.overflow = "hidden";
  root.style.scrollbarGutter = "auto";
  return () => {
    root.style.overflow = overflow;
    root.style.scrollbarGutter = scrollbarGutter;
  };
}
