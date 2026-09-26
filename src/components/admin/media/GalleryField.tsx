"use client";

import { X } from "lucide-react";
import { useState } from "react";
import { Sortable } from "@/components/admin/Sortable";
import { useToast } from "@/components/admin/Toaster";
import type { MediaAsset } from "@/lib/media/types";
import { Dropzone } from "./Dropzone";
import { MediaPreview } from "./MediaPreview";
import { uploadFile } from "./upload";

interface Props {
  value: MediaAsset[];
  onChange: (assets: MediaAsset[]) => void;
}

/** Multi-image upload with drag-to-reorder thumbnails. */
export function GalleryField({ value, onChange }: Props) {
  const toast = useToast();
  const [status, setStatus] = useState<{ done: number; total: number; progress: number } | null>(null);

  const upload = async (files: File[]) => {
    const added: MediaAsset[] = [];
    // One at a time: keeps the server's memory flat and the progress honest.
    for (const [i, file] of files.entries()) {
      setStatus({ done: i, total: files.length, progress: 0 });
      try {
        added.push(
          await uploadFile(file, {
            kind: "image",
            onProgress: (progress) => setStatus({ done: i, total: files.length, progress }),
          }),
        );
        onChange([...value, ...added]);
      } catch (error) {
        toast.show((error as Error).message, "error");
      }
    }
    setStatus(null);
  };

  return (
    <div className="space-y-3">
      {value.length > 0 && (
        <Sortable items={value} onReorder={onChange} layout="grid" className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
          {(asset, handle) => (
            <div className="group relative aspect-square overflow-hidden rounded-lg border border-border bg-bg">
              <MediaPreview asset={asset} />
              <div className="absolute inset-x-1 top-1 flex justify-between opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
                <span className="rounded-lg bg-black/60 backdrop-blur">{handle}</span>
                <button
                  type="button"
                  onClick={() => onChange(value.filter((a) => a.id !== asset.id))}
                  aria-label="Olib tashlash"
                  className="grid size-9 place-items-center rounded-lg bg-black/60 text-white backdrop-blur hover:bg-red-500/80"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>
          )}
        </Sortable>
      )}

      <Dropzone kind="image" multiple onFiles={upload} progress={status ? status.progress : null} className="min-h-28" />
      {status && (
        <p className="text-xs text-muted">
          {status.done + 1} / {status.total} rasm
        </p>
      )}
    </div>
  );
}
