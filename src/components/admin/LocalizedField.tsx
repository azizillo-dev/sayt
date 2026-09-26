"use client";

import { useState } from "react";
import { defaultLocale, locales, type Locale } from "@/lib/i18n/config";
import type { Localized } from "@/lib/settings/schema";
import { cn } from "@/lib/cn";
import { Input, Textarea } from "./ui";

interface Props {
  label: string;
  value: Localized;
  onChange: (value: Localized) => void;
  multiline?: boolean;
  hint?: string;
}

/** A short text in three languages, with compact language tabs. */
export function LocalizedField({ label, value, onChange, multiline, hint }: Props) {
  const [locale, setLocale] = useState<Locale>(defaultLocale);
  const Control = multiline ? Textarea : Input;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="text-sm font-semibold">{label}</span>
        <span className="flex gap-0.5 rounded-lg bg-bg p-0.5">
          {locales.map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setLocale(l)}
              className={cn(
                "rounded-md px-2 py-1 text-[11px] font-bold uppercase transition-colors",
                l === locale ? "bg-surface text-fg" : value[l].trim() ? "text-muted hover:text-fg" : "text-muted/50 hover:text-fg",
              )}
            >
              {l}
            </button>
          ))}
        </span>
      </div>
      <Control
        value={value[locale]}
        onChange={(e) => onChange({ ...value, [locale]: e.target.value })}
        placeholder={locale === defaultLocale ? "" : "Bo'sh qolsa avtomatik tarjima qilinadi"}
      />
      {hint && <span className="mt-1.5 block text-xs text-muted">{hint}</span>}
    </div>
  );
}
