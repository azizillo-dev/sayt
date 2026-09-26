"use client";

import { Input } from "@/components/admin/ui";
import { slugify } from "@/lib/slug";

/** Light clean-up while typing (so "my-" can be typed), full slugify on blur. */
export function SlugInput({ value, onChange, placeholder }: { value: string; onChange: (slug: string) => void; placeholder?: string }) {
  return (
    <Input
      value={value}
      onChange={(e) =>
        onChange(
          e.target.value
            .toLowerCase()
            .replace(/[^a-z0-9-]+/g, "-")
            .replace(/-{2,}/g, "-"),
        )
      }
      onBlur={() => onChange(slugify(value))}
      placeholder={placeholder}
      spellCheck={false}
      className="font-mono text-sm"
    />
  );
}
