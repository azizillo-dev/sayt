"use client";

/** Compact switch that lives in the save bar: overwrite RU/EN from the Uzbek text. */
export function RetranslateToggle({ checked, onChange }: { checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-xs leading-snug text-muted sm:text-sm">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="size-4 shrink-0 accent-[var(--accent)]" />
      RU/EN&apos;ni qayta tarjima qilish
    </label>
  );
}
