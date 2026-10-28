"use client";

import { FileText, Maximize2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Lightbox } from "@/components/media/Lightbox";
import { Picture } from "@/components/media/Picture";
import { Reveal } from "@/components/motion/Reveal";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { CONTENT_MAX_H, widthForHeight } from "@/lib/media/fit";
import type { PortfolioDisplayItem } from "@/lib/portfolio/queries";

type Labels = Dictionary["portfolio"] & { close: string };

interface Props {
  item: PortfolioDisplayItem;
  /** The rest of the section, listed beside the work like YouTube's "up next". */
  others: PortfolioDisplayItem[];
  categoryTitle: string;
  /** `/uz/portfolio/logo-branding` — base for links to the other works. */
  basePath: string;
  labels: Labels;
}

/**
 * One work, laid out like a YouTube watch page: the main picture large on
 * top with the title under it, the remaining pictures rising into view as the
 * visitor scrolls, the PDF at the end — and the rest of the section alongside.
 */
export function PortfolioWorkView({ item, others, categoryTitle, basePath, labels }: Props) {
  // The cover leads; gallery pictures follow without repeating it.
  const images = [item.cover, ...item.gallery.filter((asset) => asset.id !== item.cover.id)];
  const [open, setOpen] = useState<number | null>(null);
  const [lead, ...rest] = images;

  return (
    <div className="mx-auto mt-6 grid max-w-[1400px] gap-8 px-5 pb-24 sm:px-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-10">
      <article className="min-w-0">
        {/*
          * The frame takes the picture's own proportions — a 1920×1080
          * presentation and a 1080×1350 post both fill it edge to edge, with
          * no empty bands. A tall picture is held to the screen height (and
          * centred) by the same width cap as the content images.
          */}
        <button
          type="button"
          onClick={() => setOpen(0)}
          aria-label={labels.zoomHint}
          style={{ maxWidth: widthForHeight(lead!, CONTENT_MAX_H) }}
          className="group relative mx-auto block w-full cursor-zoom-in overflow-hidden rounded-2xl bg-surface"
        >
          <Picture asset={lead!} priority sizes="(min-width: 1024px) 960px, 100vw" alt={item.title} />
          <span className="absolute bottom-3 right-3 grid size-10 place-items-center rounded-full bg-black/55 text-white opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100">
            <Maximize2 className="size-4" />
          </span>
        </button>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">{categoryTitle}</p>
            <h1 className="mt-1.5 font-display text-2xl font-bold leading-tight tracking-tight sm:text-3xl">{item.title}</h1>
          </div>
          {item.pdfUrl && <PdfButton href={item.pdfUrl} label={labels.pdfOpen} />}
        </div>

        {rest.length > 0 && (
          <div className="mt-10 space-y-6 sm:space-y-8">
            {rest.map((asset, index) => (
              <Reveal key={asset.id} y={56}>
                <button
                  type="button"
                  onClick={() => setOpen(index + 1)}
                  className="block w-full cursor-zoom-in overflow-hidden rounded-2xl bg-surface"
                >
                  <Picture asset={asset} sizes="(min-width: 1024px) 960px, 100vw" maxHeight={CONTENT_MAX_H} alt={item.title} />
                </button>
              </Reveal>
            ))}
          </div>
        )}

        {/* Only when pictures push the button above out of sight — otherwise the two would sit together. */}
        {item.pdfUrl && rest.length > 0 && (
          <Reveal y={56}>
            <a
              href={item.pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-10 flex items-center gap-4 rounded-2xl border border-border bg-surface p-4 transition-colors hover:border-accent sm:p-5"
            >
              <span className="grid size-14 shrink-0 place-items-center rounded-xl bg-red-600 text-white">
                <FileText className="size-7" />
              </span>
              <span className="min-w-0">
                <span className="block font-semibold">{labels.pdfTitle}</span>
                <span className="block truncate text-sm text-muted">{item.title} · PDF</span>
              </span>
              <span className="ml-auto shrink-0 text-sm font-semibold text-accent">{labels.pdfOpen}</span>
            </a>
          </Reveal>
        )}
      </article>

      {others.length > 0 && (
        <aside className="min-w-0 lg:sticky lg:top-[calc(var(--header-h)+1rem)] lg:h-fit">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-[0.18em] text-muted">{labels.otherWorks}</h2>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            {others.map((other) => (
              <li key={other.id}>
                <Link
                  href={`${basePath}/${other.id}`}
                  // Replaces rather than adds a history entry: switching between
                  // works is browsing one section, so "back" leaves it in one step.
                  replace
                  className="group flex gap-3 rounded-xl p-1.5 transition-colors hover:bg-surface">
                  <div className="relative aspect-video w-40 shrink-0 overflow-hidden rounded-lg bg-surface">
                    <Picture asset={other.cover} fill sizes="160px" imgClassName="transition-transform duration-500 group-hover:scale-105" />
                  </div>
                  <div className="min-w-0 py-1">
                    <p className="line-clamp-2 text-sm font-semibold leading-snug">{other.title}</p>
                    {other.pdfUrl && (
                      <p className="mt-1.5 inline-flex items-center gap-1 text-xs text-muted">
                        <FileText className="size-3.5" /> PDF
                      </p>
                    )}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </aside>
      )}

      <Lightbox items={images} index={open} onChange={setOpen} labels={{ close: labels.close }} />
    </div>
  );
}

function PdfButton({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex shrink-0 items-center gap-2 self-start rounded-full bg-fg px-4 py-2.5 text-sm font-semibold text-bg transition-transform hover:scale-[1.03]"
    >
      <FileText className="size-4" />
      {label}
    </a>
  );
}
