"use client";

import { RefreshCw, Trash2 } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/components/admin/Toaster";
import type { MediaAsset } from "@/lib/media/types";
import { cn } from "@/lib/cn";
import { Dropzone } from "./Dropzone";
import { MediaPreview } from "./MediaPreview";
import { uploadFile, type UploadKind } from "./upload";

interface Props {
  value: MediaAsset | null;
  onChange: (asset: MediaAsset | null) => void;
  kind?: UploadKind;
  /** Preview box shape. */
  aspect?: "video" | "square" | "auto";
  /** Show the "keep every pixel" option for images. */
  allowLossless?: boolean;
  /** Round preview (profile photo). */
  round?: boolean;
  className?: string;
}

const aspects = { video: "aspect-video", square: "aspect-square", auto: "min-h-32" } as const;

const actionClass =
  "inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg border border-border bg-bg text-[13px] font-semibold transition-colors hover:border-muted";

export function MediaField({ value, onChange, kind = "image", aspect = "video", allowLossless = true, round, className }: Props) {
  const toast = useToast();
  const [progress, setProgress] = useState<number | null>(null);
  const [lossless, setLossless] = useState(false);

  const upload = async ([file]: File[]) => {
    if (!file) return;
    setProgress(0);
    try {
      onChange(await uploadFile(file, { kind, lossless, onProgress: setProgress }));
    } catch (error) {
      toast.show((error as Error).message, "error");
    } finally {
      setProgress(null);
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      {value ? (
        <>
          <div className={cn("relative overflow-hidden border border-border bg-bg", round ? "rounded-full" : "rounded-xl", aspects[aspect])}>
            <MediaPreview asset={value} contain={aspect === "auto"} />
            {progress != null && (
              <div className="absolute inset-0 grid place-items-center bg-bg/85 p-2 text-center text-xs font-semibold backdrop-blur-sm">
                {progress < 1 ? `Yuklanmoqda… ${Math.round(progress * 100)}%` : "Optimallashtirilmoqda…"}
              </div>
            )}
          </div>

          {/* Actions sit below the preview — overlay buttons are easy to mis-tap on a phone. */}
          <div className="flex gap-2">
            <Dropzone kind={kind} onFiles={upload} inline className={actionClass}>
              <span className="inline-flex items-center gap-1.5">
                <RefreshCw className="size-3.5" /> Almashtirish
              </span>
            </Dropzone>
            <button type="button" onClick={() => onChange(null)} className={`${actionClass} hover:border-red-500/60 hover:text-red-400`}>
              <Trash2 className="size-3.5" /> O&apos;chirish
            </button>
          </div>
        </>
      ) : (
        <Dropzone kind={kind} onFiles={upload} progress={progress} className={aspects[aspect]} />
      )}

      {allowLossless && kind !== "video" && (
        <label className="flex cursor-pointer items-start gap-2 text-[11px] leading-snug text-muted">
          <input
            type="checkbox"
            checked={lossless}
            onChange={(e) => setLossless(e.target.checked)}
            className="mt-0.5 size-3.5 shrink-0 accent-[var(--accent)]"
          />
          Siqmasdan yuklash (lossless) — piksel-art, mayda matnli maketlar uchun
        </label>
      )}
    </div>
  );
}
