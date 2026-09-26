"use client";

import { Check } from "lucide-react";
import { useState } from "react";
import { contrastRatio } from "@/lib/theme/color";

interface Swatch {
  hex: string;
  name: string;
}

/** Brand colours; clicking a swatch copies its HEX code. */
export function PaletteSwatches({ colors }: { colors: Swatch[] }) {
  const [copied, setCopied] = useState<string | null>(null);

  const copy = async (hex: string) => {
    await navigator.clipboard?.writeText(hex.toUpperCase()).catch(() => {});
    setCopied(hex);
    setTimeout(() => setCopied((c) => (c === hex ? null : c)), 1400);
  };

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {colors.map(({ hex, name }) => {
        const ink = contrastRatio(hex, "#ffffff") >= 3 ? "#ffffff" : "#111111";
        return (
          <button
            key={hex + name}
            type="button"
            onClick={() => copy(hex)}
            className="group flex aspect-[4/5] flex-col justify-end rounded-card-sm p-4 text-left transition-transform duration-500 ease-out-expo hover:-translate-y-1"
            style={{ backgroundColor: hex, color: ink }}
          >
            {name && <span className="text-sm font-semibold">{name}</span>}
            <span className="flex items-center gap-1.5 font-mono text-xs uppercase opacity-80">
              {copied === hex ? <Check className="size-3.5" /> : null}
              {hex}
            </span>
          </button>
        );
      })}
    </div>
  );
}
