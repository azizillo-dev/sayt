"use client";

import { Save } from "lucide-react";
import { useTransition } from "react";
import { useDirtyState } from "@/components/admin/editor/hooks";
import { useToast } from "@/components/admin/Toaster";
import { Button, Card, Field, Select, Switch } from "@/components/admin/ui";
import { savePartnerSettings } from "@/lib/admin/actions/settings";
import type { SiteSettings } from "@/lib/settings/schema";

type Config = SiteSettings["partners"];

function Range({ label, value, min, max, step = 1, unit, onChange }: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit: string;
  onChange: (v: number) => void;
}) {
  return (
    <Field label={label}>
      <div className="flex items-center gap-3">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="flex-1 accent-[var(--accent)]"
        />
        <span className="w-20 text-right text-sm tabular-nums text-muted">
          {value} {unit}
        </span>
      </div>
    </Field>
  );
}

export function MarqueeSettings({ initial }: { initial: Config }) {
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const { value, setValue, dirty, markSaved } = useDirtyState(initial);
  const set = (patch: Partial<Config>) => setValue((v) => ({ ...v, ...patch }));

  const save = () =>
    startTransition(async () => {
      const result = await savePartnerSettings(value);
      if (toast.result(result, "Sozlamalar saqlandi")) markSaved(value);
    });

  return (
    <Card title="Aylanish sozlamalari" className="h-fit xl:sticky xl:top-6">
      <div className="space-y-4">
        <Switch checked={value.enabled} onChange={(enabled) => set({ enabled })} label="Hamkorlar bo'limi" description="O'chirilsa, bo'lim va sahifa yashiriladi" />
        <Range label="Harakatdagi logotiplar soni" value={value.marqueeCount} min={3} max={40} unit="ta" onChange={(marqueeCount) => set({ marqueeCount })} />
        <Range label="Tezlik" value={value.speed} min={10} max={300} step={5} unit="px/s" onChange={(speed) => set({ speed })} />
        <Field label="Yo'nalish">
          <Select value={value.direction} onChange={(e) => set({ direction: e.target.value as Config["direction"] })}>
            <option value="left">← Chapga</option>
            <option value="right">O&apos;ngga →</option>
          </Select>
        </Field>
        <div className="space-y-3 border-t border-border pt-4">
          <Switch checked={value.pauseOnHover} onChange={(pauseOnHover) => set({ pauseOnHover })} label="Sichqoncha ustida to'xtash" />
          <Switch checked={value.grayscale} onChange={(grayscale) => set({ grayscale })} label="Oq-qora" description="Ustiga borganda rangli bo'ladi" />
          <Switch
            checked={value.invertOnDark}
            onChange={(invertOnDark) => set({ invertOnDark })}
            label="Tungi rejimda ranglarni teskari qilish"
            description="Qora logotiplar qorong'i fonda ko'rinishi uchun"
          />
        </div>
        <Button variant="primary" onClick={save} loading={pending} disabled={!dirty} icon={<Save className="size-4" />} className="w-full">
          Saqlash
        </Button>
      </div>
    </Card>
  );
}
