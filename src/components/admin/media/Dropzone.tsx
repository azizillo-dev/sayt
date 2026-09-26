"use client";

import { UploadCloud } from "lucide-react";
import { useRef, useState, type ReactNode } from "react";
import { IMAGE_ACCEPT, VIDEO_ACCEPT } from "@/lib/media/limits";
import { cn } from "@/lib/cn";
import type { UploadKind } from "./upload";

const accepts: Record<UploadKind, string> = {
  image: IMAGE_ACCEPT,
  video: VIDEO_ACCEPT,
  any: `${IMAGE_ACCEPT},${VIDEO_ACCEPT}`,
};

interface Props {
  kind: UploadKind;
  multiple?: boolean;
  onFiles: (files: File[]) => void;
  /** 0–1 while uploading. */
  progress?: number | null;
  /** Render as a plain control (no dashed box) — for "replace" buttons. */
  inline?: boolean;
  className?: string;
  children?: ReactNode;
}

/** Click or drop files. Shows an upload progress overlay. */
export function Dropzone({ kind, multiple, onFiles, progress, inline, className, children }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const busy = progress != null;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => !busy && input.current?.click()}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && !busy && input.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        if (!busy && e.dataTransfer.files.length) onFiles([...e.dataTransfer.files]);
      }}
      className={cn(
        "relative cursor-pointer text-center transition-colors",
        !inline && "flex flex-col items-center justify-center gap-2 overflow-hidden rounded-xl border border-dashed p-4 sm:p-6",
        !inline && (over ? "border-accent bg-accent/10" : "border-border bg-bg hover:border-muted"),
        inline && over && "border-accent text-accent",
        busy && "cursor-progress",
        className,
      )}
    >
      {children ?? (
        <>
          <UploadCloud className="size-5 text-muted sm:size-6" />
          <span className="text-[13px] font-semibold sm:text-sm">{multiple ? "Fayllarni tanlang" : "Faylni tanlang"}</span>
          <span className="text-[11px] leading-snug text-muted">
            {kind === "video" ? "MP4 / WebM, 10 soniyagacha" : kind === "image" ? "JPG, PNG, WebP, AVIF, GIF, SVG, TIFF" : "Rasm yoki 10 soniyali video"}
          </span>
        </>
      )}

      {busy && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-bg/85 backdrop-blur-sm">
          <span className="text-sm font-semibold">
            {progress < 1 ? `Yuklanmoqda… ${Math.round(progress * 100)}%` : "Optimallashtirilmoqda…"}
          </span>
          <span className="h-1.5 w-2/3 overflow-hidden rounded-full bg-border">
            <span
              className={cn("block h-full rounded-full bg-accent transition-[width] duration-200", progress >= 1 && "animate-pulse")}
              style={{ width: `${Math.max(4, progress * 100)}%` }}
            />
          </span>
        </div>
      )}

      <input
        ref={input}
        type="file"
        accept={accepts[kind]}
        multiple={multiple}
        hidden
        onChange={(e) => {
          if (e.target.files?.length) onFiles([...e.target.files]);
          e.target.value = "";
        }}
      />
    </div>
  );
}
