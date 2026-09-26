"use client";

/**
 * A colour swatch with a hex field beside it. The hex is uncontrolled while
 * being typed (`key` re-mounts it when the value changes elsewhere) and only
 * applied on blur, so a half-typed "#1a2" never reaches the settings.
 */
export function ColorRow({ label, value, onChange }: { label: string; value: string; onChange: (hex: string) => void }) {
  return (
    <div className="flex items-center gap-2.5">
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label}
        className="h-9 w-10 shrink-0 cursor-pointer rounded-lg border border-border bg-transparent"
      />
      <span className="min-w-0 flex-1 text-[13px] leading-snug sm:text-sm">{label}</span>
      <input
        key={value}
        defaultValue={value}
        onBlur={(e) => {
          const raw = e.target.value.trim();
          const hex = raw.startsWith("#") ? raw : `#${raw}`;
          if (/^#[0-9a-fA-F]{6}$/.test(hex)) onChange(hex.toLowerCase());
          else e.target.value = value;
        }}
        spellCheck={false}
        className="h-9 w-[74px] shrink-0 rounded-lg border border-border bg-bg px-1 text-center font-mono text-[11px] uppercase outline-none focus:border-accent sm:w-24 sm:text-xs"
      />
    </div>
  );
}
