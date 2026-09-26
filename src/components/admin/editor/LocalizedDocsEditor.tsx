"use client";

import { useState } from "react";
import { BlockEditor } from "@/components/admin/blocks/BlockEditor";
import { Field, Input, Textarea } from "@/components/admin/ui";
import type { LocalizedDoc, LocalizedDocs } from "@/lib/content/localize";
import { defaultLocale, localeLabels, locales, type Locale } from "@/lib/i18n/config";
import type { MediaAsset, MediaMap } from "@/lib/media/types";
import { cn } from "@/lib/cn";

interface Props {
  docs: LocalizedDocs;
  onChange: (docs: LocalizedDocs) => void;
  media: MediaMap;
  onMedia: (asset: MediaAsset) => void;
  excerptLabel?: string;
}

function isFilled(doc: LocalizedDoc) {
  return Boolean(doc.title.trim());
}

/**
 * Title, excerpt and blocks per language. Uzbek is the source: empty RU/EN are
 * machine-translated on save (the "re-translate" switch lives in the save bar)
 * and can then be refined by hand here.
 */
export function LocalizedDocsEditor({ docs, onChange, media, onMedia, excerptLabel = "Qisqa tavsif" }: Props) {
  const [locale, setLocale] = useState<Locale>(defaultLocale);
  const doc = docs[locale];
  const set = (patch: Partial<LocalizedDoc>) => onChange({ ...docs, [locale]: { ...doc, ...patch } });

  return (
    <div>
      <div role="tablist" className="flex rounded-xl border border-border bg-bg p-1">
        {locales.map((l) => (
          <button
            key={l}
            type="button"
            role="tab"
            aria-selected={l === locale}
            onClick={() => setLocale(l)}
            className={cn(
              "flex-1 rounded-lg px-2 py-2 text-sm font-semibold transition-colors",
              l === locale ? "bg-surface text-fg shadow" : "text-muted hover:text-fg",
            )}
          >
            {localeLabels[l]}
            {l !== defaultLocale && (
              <span
                className={cn("ml-1.5 inline-block size-1.5 rounded-full align-middle", isFilled(docs[l]) ? "bg-emerald-400" : "bg-border")}
                title={isFilled(docs[l]) ? "To'ldirilgan" : "Saqlashda avtomatik tarjima qilinadi"}
              />
            )}
          </button>
        ))}
      </div>

      {locale !== defaultLocale && (
        <p className="mt-2 text-xs text-muted">Avtomatik tarjima. Qo&apos;lda tuzatsangiz, keyingi saqlashda o&apos;zgarmaydi.</p>
      )}

      <div className="mt-5 space-y-4">
        <Field label="Sarlavha">
          <Input value={doc.title} onChange={(e) => set({ title: e.target.value })} className="font-semibold" />
        </Field>
        <Field label={excerptLabel} hint="Kartochkada sarlavha ostida chiqadi">
          <Textarea value={doc.excerpt} onChange={(e) => set({ excerpt: e.target.value })} className="min-h-16" maxLength={600} />
        </Field>
        <div>
          <span className="mb-1.5 block text-sm font-semibold">Kontent</span>
          {/* Keyed by locale so block state resets when switching tabs. */}
          <BlockEditor key={locale} blocks={doc.blocks} onChange={(blocks) => set({ blocks })} media={media} onMedia={onMedia} />
        </div>
      </div>
    </div>
  );
}
