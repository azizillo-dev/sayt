"use client";

import { Moon, RotateCcw, Save, Sun } from "lucide-react";
import { useState, useTransition } from "react";
import { ColorRow } from "@/components/admin/ColorRow";
import { useDirtyState, useSaveShortcut, useUnsavedGuard } from "@/components/admin/editor/hooks";
import { useToast } from "@/components/admin/Toaster";
import { Button, Card, Field, SaveBar, Select } from "@/components/admin/ui";
import { resetTheme, saveTheme } from "@/lib/admin/actions/settings";
import { CONTRAST_TEXT, CONTRAST_UI, contrastRatio } from "@/lib/theme/color";
import { fontKeys, fontLabels, fontVar } from "@/lib/theme/fonts";
import { defaultTheme, paletteKeys, themePresets, type Palette, type PaletteKey, type Theme } from "@/lib/theme/schema";
import { cn } from "@/lib/cn";
import { ThemePreview } from "./ThemePreview";

const colorLabels: Record<PaletteKey, string> = {
  background: "Fon",
  surface: "Kartochka foni",
  text: "Matn",
  muted: "Ikkinchi darajali matn",
  border: "Chegara chiziqlari",
  accent: "Asosiy (aksent) rang",
  accentText: "Aksent ustidagi matn",
};

/** Colour pairs that must stay readable, with the minimum WCAG ratio. */
const checks: { fg: PaletteKey; bg: PaletteKey; min: number; label: string }[] = [
  { fg: "text", bg: "background", min: CONTRAST_TEXT, label: "Matn / fon" },
  { fg: "muted", bg: "background", min: CONTRAST_UI, label: "Ikkinchi matn / fon" },
  { fg: "text", bg: "surface", min: CONTRAST_TEXT, label: "Matn / kartochka" },
  { fg: "accentText", bg: "accent", min: CONTRAST_UI, label: "Tugma matni / tugma" },
];

function PaletteEditor({ palette, onChange }: { palette: Palette; onChange: (p: Palette) => void }) {
  const problems = checks
    .map((c) => ({ ...c, ratio: contrastRatio(palette[c.fg], palette[c.bg]) }))
    .filter((c) => c.ratio < c.min);

  return (
    <div className="space-y-2 sm:space-y-3">
      {paletteKeys.map((key) => (
        <ColorRow key={key} label={colorLabels[key]} value={palette[key]} onChange={(hex) => onChange({ ...palette, [key]: hex })} />
      ))}
      {problems.length > 0 && (
        <div className="rounded-xl bg-amber-500/10 p-3 text-xs leading-relaxed text-amber-300">
          <p className="font-semibold">O&apos;qilishi qiyin bo&apos;lishi mumkin:</p>
          <ul className="mt-1 list-inside list-disc">
            {problems.map((p) => (
              <li key={p.label}>
                {p.label} — {p.ratio.toFixed(1)}:1 (kamida {p.min}:1 tavsiya etiladi)
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export function ThemeEditor({ initial, brand }: { initial: Theme; brand: string }) {
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const [mode, setMode] = useState<"light" | "dark">("dark");
  const { value, setValue, dirty, markSaved } = useDirtyState(initial);
  const set = (patch: Partial<Theme>) => setValue((v) => ({ ...v, ...patch }));

  useUnsavedGuard(dirty);

  const save = () =>
    startTransition(async () => {
      const result = await saveTheme(value);
      if (toast.result(result, "Dizayn saqlandi — saytda allaqachon yangilandi")) markSaved(result.data);
    });
  useSaveShortcut(() => !pending && save());

  const reset = () => {
    if (!window.confirm("Dizayn standart holatiga qaytarilsinmi?")) return;
    startTransition(async () => {
      const result = await resetTheme();
      if (toast.result(result, "Standart dizayn tiklandi")) markSaved(result.data);
    });
  };

  return (
    <div className="grid gap-4 sm:gap-6 xl:grid-cols-[1fr_460px]">
      <div className="min-w-0 space-y-4 sm:space-y-6">
        <Card title="Tayyor uslublar" description="Bittasini tanlang va keyin xohlaganingizcha moslang">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
            {themePresets.map(({ name, theme }) => (
              <button
                key={name}
                type="button"
                onClick={() => setValue(theme)}
                className="group overflow-hidden rounded-xl border border-border text-left transition-colors hover:border-accent"
              >
                <div className="flex h-11 sm:h-16">
                  {[theme.dark.background, theme.dark.surface, theme.dark.accent, theme.light.background, theme.light.accent].map((c, i) => (
                    <span key={i} className="flex-1" style={{ backgroundColor: c }} />
                  ))}
                </div>
                <p className="px-2.5 py-1.5 text-[13px] font-semibold sm:px-3 sm:py-2 sm:text-sm" style={{ fontFamily: fontVar(theme.fontDisplay) }}>
                  {name}
                </p>
              </button>
            ))}
          </div>
        </Card>

        <Card
          title="Ranglar"
          actions={
            <div className="flex rounded-lg bg-bg p-1">
              {(["light", "dark"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className={cn(
                    "flex items-center gap-1 rounded-md px-2.5 py-1.5 text-[13px] font-semibold transition-colors sm:gap-1.5 sm:px-3 sm:text-sm",
                    mode === m ? "bg-surface text-fg" : "text-muted",
                  )}
                >
                  {m === "light" ? <Sun className="size-3.5 sm:size-4" /> : <Moon className="size-3.5 sm:size-4" />}
                  {m === "light" ? "Kunduzgi" : "Tungi"}
                </button>
              ))}
            </div>
          }
        >
          <PaletteEditor key={mode} palette={value[mode]} onChange={(palette) => set({ [mode]: palette })} />
        </Card>

        <Card title="Shriftlar va shakl">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Sarlavhalar shrifti">
              <Select value={value.fontDisplay} onChange={(e) => set({ fontDisplay: e.target.value as Theme["fontDisplay"] })}>
                {fontKeys.map((k) => (
                  <option key={k} value={k}>
                    {fontLabels[k]}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Matn shrifti">
              <Select value={value.fontBody} onChange={(e) => set({ fontBody: e.target.value as Theme["fontBody"] })}>
                {fontKeys.map((k) => (
                  <option key={k} value={k}>
                    {fontLabels[k]}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={`Burchaklar yumaloqligi — ${value.radius}px`}>
              <input
                type="range"
                min={0}
                max={40}
                value={value.radius}
                onChange={(e) => set({ radius: Number(e.target.value) })}
                className="mt-3 w-full accent-[var(--accent)]"
              />
            </Field>
            <Field label="Birinchi kirishda" hint="Tashrif buyuruvchi tugma bilan o'zi almashtira oladi">
              <Select value={value.defaultMode} onChange={(e) => set({ defaultMode: e.target.value as Theme["defaultMode"] })}>
                <option value="system">Qurilma sozlamasiga qarab</option>
                <option value="dark">Doim tungi</option>
                <option value="light">Doim kunduzgi</option>
              </Select>
            </Field>
          </div>
        </Card>
      </div>

      <div className="min-w-0 xl:sticky xl:top-6 xl:h-fit">
        <ThemePreview theme={value} mode={mode} brand={brand} />
      </div>

      <div className="xl:col-span-2">
        <SaveBar status={dirty ? "Saqlanmagan o'zgarishlar · Ctrl+S" : "Saqlangan"}>
          <Button variant="ghost" onClick={reset} disabled={pending || JSON.stringify(value) === JSON.stringify(defaultTheme)} icon={<RotateCcw className="size-4" />}>
            Standart
          </Button>
          <Button variant="primary" onClick={save} loading={pending} disabled={!dirty} icon={<Save className="size-4" />}>
            Saqlash
          </Button>
        </SaveBar>
      </div>
    </div>
  );
}
