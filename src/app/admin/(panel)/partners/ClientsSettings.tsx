"use client";

import { Save } from "lucide-react";
import { useState, useTransition } from "react";
import { useDirtyState } from "@/components/admin/editor/hooks";
import { LocalizedField } from "@/components/admin/LocalizedField";
import { useToast } from "@/components/admin/Toaster";
import { Button, Card, Field, Input, Switch } from "@/components/admin/ui";
import { saveClientsSettings } from "@/lib/admin/actions/settings";
import type { SiteSettings } from "@/lib/settings/schema";

type Config = SiteSettings["clients"];

/** The "50+ projects" card under the hero, with the first partner logos. */
export function ClientsSettings({ initial }: { initial: Config }) {
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const [retranslate, setRetranslate] = useState(false);
  const { value, setValue, dirty, markSaved } = useDirtyState(initial);
  const set = (patch: Partial<Config>) => setValue((v) => ({ ...v, ...patch }));

  const save = () =>
    startTransition(async () => {
      const result = await saveClientsSettings(value, retranslate);
      if (!toast.result(result, "Saqlandi")) return;
      markSaved(result.data);
      setRetranslate(false);
    });

  return (
    <Card title="Tajriba bloki" description="Bosh sahifada hero ostidagi “50+” karta va birinchi hamkor logotiplari">
      <div className="space-y-4">
        <Switch checked={value.enabled} onChange={(enabled) => set({ enabled })} label="Bosh sahifada ko'rsatish" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Raqam">
            <Input value={value.count} onChange={(e) => set({ count: e.target.value })} placeholder="50+" maxLength={12} />
          </Field>
          <Field label="Logotiplar soni" hint="Ro'yxatdagi birinchi hamkorlar">
            <Input
              type="number"
              min={0}
              max={11}
              value={value.logoCount}
              onChange={(e) => set({ logoCount: Math.min(11, Math.max(0, Number(e.target.value) || 0)) })}
            />
          </Field>
        </div>
        <LocalizedField label="Sarlavha" value={value.title} onChange={(title) => set({ title })} />
        <LocalizedField label="Matn" value={value.text} onChange={(text) => set({ text })} multiline />
        <LocalizedField label="Oxirgi tugma" value={value.moreLabel} onChange={(moreLabel) => set({ moreLabel })} hint="Barcha hamkorlar sahifasiga olib boradi" />
        <label className="flex cursor-pointer items-start gap-2 text-xs text-muted">
          <input type="checkbox" checked={retranslate} onChange={(e) => setRetranslate(e.target.checked)} className="mt-0.5 accent-[var(--accent)]" />
          O&apos;zbekcha matnni o&apos;zgartirdim — RU/EN qayta tarjima qilinsin
        </label>
        <Button variant="primary" onClick={save} loading={pending} disabled={!dirty && !retranslate} icon={<Save className="size-4" />} className="w-full">
          Saqlash
        </Button>
      </div>
    </Card>
  );
}
