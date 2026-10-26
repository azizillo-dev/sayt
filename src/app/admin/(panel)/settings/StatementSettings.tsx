"use client";

import { Save } from "lucide-react";
import { useState, useTransition } from "react";
import { useDirtyState } from "@/components/admin/editor/hooks";
import { LocalizedField } from "@/components/admin/LocalizedField";
import { useToast } from "@/components/admin/Toaster";
import { Button, Card, Switch } from "@/components/admin/ui";
import { saveStatementSettings } from "@/lib/admin/actions/settings";
import type { SiteSettings } from "@/lib/settings/schema";

type Config = SiteSettings["statement"];

/** The "DIZAYN" statement shown before the videos on the home page. */
export function StatementSettings({ initial }: { initial: Config }) {
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const [retranslate, setRetranslate] = useState(false);
  const { value, setValue, dirty, markSaved } = useDirtyState(initial);
  const set = (patch: Partial<Config>) => setValue((v) => ({ ...v, ...patch }));

  const save = () =>
    startTransition(async () => {
      const result = await saveStatementSettings(value, retranslate);
      if (!toast.result(result, "Saqlandi")) return;
      markSaved(result.data);
      setRetranslate(false);
    });

  return (
    <Card title="“Dizayn” bloki" description="Bosh sahifada videolardan oldingi katta so'z va izoh">
      <div className="space-y-4">
        <Switch checked={value.enabled} onChange={(enabled) => set({ enabled })} label="Bosh sahifada ko'rsatish" />
        <LocalizedField label="Katta so'z" value={value.word} onChange={(word) => set({ word })} />
        <LocalizedField label="Sarlavha" value={value.headline} onChange={(headline) => set({ headline })} />
        <LocalizedField label="Matn" value={value.text} onChange={(text) => set({ text })} multiline />
        <LocalizedField label="Jarayon" value={value.steps} onChange={(steps) => set({ steps })} hint="Masalan: Maqsad → G'oya → Vizual yechim → Natija" />
        <label className="flex cursor-pointer items-start gap-2 text-xs text-muted">
          <input type="checkbox" checked={retranslate} onChange={(e) => setRetranslate(e.target.checked)} className="mt-0.5 accent-[var(--accent)]" />
          O&apos;zbekcha matnni o&apos;zgartirdim — RU/EN qayta tarjima qilinsin
        </label>
        <div className="flex justify-end">
          <Button variant="primary" onClick={save} loading={pending} disabled={!dirty && !retranslate} icon={<Save className="size-4" />}>
            Saqlash
          </Button>
        </div>
      </div>
    </Card>
  );
}
