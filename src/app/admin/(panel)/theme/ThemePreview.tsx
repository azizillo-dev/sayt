import { ArrowRight, Moon } from "lucide-react";
import type { CSSProperties } from "react";
import { fontVar } from "@/lib/theme/fonts";
import type { Theme } from "@/lib/theme/schema";

/**
 * A miniature of the public site painted with the theme being edited.
 * Colours are applied inline, so the admin's own palette is unaffected.
 */
export function ThemePreview({ theme, mode, brand }: { theme: Theme; mode: "light" | "dark"; brand: string }) {
  const p = theme[mode];
  const radius = theme.radius;
  const display: CSSProperties = { fontFamily: fontVar(theme.fontDisplay) };

  return (
    <div className="overflow-hidden rounded-2xl border border-border shadow-2xl shadow-black/40">
      <div
        className="p-5 transition-colors duration-300"
        style={{ background: p.background, color: p.text, fontFamily: fontVar(theme.fontBody) }}
      >
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold" style={display}>
            {brand}
          </span>
          <span className="flex gap-3 text-[11px] font-semibold">
            <span>About</span>
            <span>Ko&apos;proq ▾</span>
          </span>
        </div>

        <h3 className="mt-8 text-[1.75rem] font-bold leading-[1.05] tracking-tight" style={display}>
          Vizual hikoyalar yarataman
        </h3>
        <p className="mt-2 text-xs" style={{ color: p.muted }}>
          Brending, logotip va poligrafiya.
        </p>

        <div className="mt-4 flex gap-2">
          <span className="inline-flex items-center gap-1 px-3 py-1.5 text-[11px] font-semibold" style={{ background: p.accent, color: p.accentText, borderRadius: 999 }}>
            Ishlarni ko&apos;rish <ArrowRight className="size-3" />
          </span>
          <span className="px-3 py-1.5 text-[11px] font-semibold" style={{ border: `1px solid ${p.border}`, borderRadius: 999 }}>
            Bog&apos;lanish
          </span>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          {[0, 1].map((i) => (
            <div key={i}>
              <div
                className="aspect-[4/3]"
                style={{
                  borderRadius: radius * 0.6,
                  background: i === 0 ? `linear-gradient(135deg, ${p.accent}, ${p.surface})` : p.surface,
                  border: `1px solid ${p.border}`,
                }}
              />
              <p className="mt-2 text-[10px]" style={{ color: p.muted }}>
                18-sen, 2026
              </p>
              <p className="text-xs font-bold leading-tight" style={display}>
                {i === 0 ? "Brending loyihasi" : "Qadoq dizayni"}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4" style={{ background: p.surface, border: `1px solid ${p.border}`, borderRadius: radius }}>
          <p className="text-sm font-bold" style={display}>
            Birga ishlaymizmi?
          </p>
          <div className="mt-3 h-8" style={{ background: p.background, border: `1px solid ${p.border}`, borderRadius: radius * 0.6 }} />
        </div>

        <div className="mt-4 flex justify-end">
          <span className="grid size-8 place-items-center rounded-full" style={{ background: p.surface, border: `1px solid ${p.border}` }}>
            <Moon className="size-3.5" />
          </span>
        </div>
      </div>
    </div>
  );
}
