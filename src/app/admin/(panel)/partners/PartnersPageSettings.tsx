"use client";

import { Save } from "lucide-react";
import { useTransition } from "react";
import { useDirtyState } from "@/components/admin/editor/hooks";
import { useToast } from "@/components/admin/Toaster";
import { Button, Card, Switch } from "@/components/admin/ui";
import { savePartnerSettings } from "@/lib/admin/actions/settings";
import type { SiteSettings } from "@/lib/settings/schema";

type Config = SiteSettings["partners"];

export function PartnersPageSettings({ initial }: { initial: Config }) {
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
    <Card title="Barcha hamkorlar sahifasi">
      <div className="space-y-4">
        <Switch checked={value.enabled} onChange={(enabled) => set({ enabled })} label="Sahifa yoqilgan" description="O'chirilsa, sahifa va unga olib boruvchi “View All” yashiriladi" />
        <div className="space-y-3">
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
