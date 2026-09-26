"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { MediaAsset, MediaMap } from "@/lib/media/types";

/** Warns before closing the tab with unsaved changes. */
export function useUnsavedGuard(dirty: boolean) {
  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);
}

/** Ctrl/⌘ + S triggers save instead of the browser's "save page". */
export function useSaveShortcut(save: () => void) {
  const ref = useRef(save);
  useEffect(() => {
    ref.current = save;
  });
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        ref.current();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);
}

/** Media known to an editor; grows as files are uploaded. */
export function useMediaMap(initial: MediaMap) {
  const [media, setMedia] = useState(initial);
  const addMedia = useCallback((asset: MediaAsset) => setMedia((m) => (m[asset.id] ? m : { ...m, [asset.id]: asset })), []);
  return [media, addMedia] as const;
}

/**
 * Form state with a dirty flag. `markSaved` records the current value as the
 * saved baseline (compared structurally, so undoing an edit clears "dirty").
 */
export function useDirtyState<T>(initial: T) {
  const [value, setValue] = useState(initial);
  const [saved, setSaved] = useState(() => JSON.stringify(initial));
  const dirty = JSON.stringify(value) !== saved;
  const markSaved = useCallback((next: T) => {
    setValue(next);
    setSaved(JSON.stringify(next));
  }, []);
  return { value, setValue, dirty, markSaved };
}
