"use client";

import { Save, TriangleAlert } from "lucide-react";
import { useState, useTransition } from "react";
import { useDirtyState, useSaveShortcut, useUnsavedGuard } from "@/components/admin/editor/hooks";
import { LocalizedField } from "@/components/admin/LocalizedField";
import { useToast } from "@/components/admin/Toaster";
import { Button, Card, Field, Input, SaveBar, Switch } from "@/components/admin/ui";
import { saveGeneralSettings } from "@/lib/admin/actions/settings";
import type { MediaAsset } from "@/lib/media/types";
import type { SiteSettings } from "@/lib/settings/schema";
import { HeroSettings } from "./HeroSettings";

type General = Pick<SiteSettings, "brand" | "hero" | "projects" | "contact" | "seo">;

interface Props {
  initial: General;
  /** Resolved from `hero.photoId` — settings store only the id. */
  heroPhoto: MediaAsset | null;
  smtpConfigured: boolean;
}

export function GeneralSettingsForm({ initial, heroPhoto, smtpConfigured }: Props) {
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const [retranslate, setRetranslate] = useState(false);
  const [photo, setPhoto] = useState(heroPhoto);
  const { value, setValue, dirty, markSaved } = useDirtyState(initial);

  const setGroup = <K extends keyof General>(key: K, patch: Partial<General[K]>) =>
    setValue((v) => ({ ...v, [key]: { ...v[key], ...patch } }));

  useUnsavedGuard(dirty);

  const save = () =>
    startTransition(async () => {
      const result = await saveGeneralSettings(value, retranslate);
      if (!toast.result(result, "Sozlamalar saqlandi")) return;
      markSaved(result.data);
      setRetranslate(false);
    });
  useSaveShortcut(() => !pending && save());

  return (
    <div className="space-y-6">
      <Card title="Brend" description="Saytning chap yuqori burchagidagi yozuv">
        <Field label="Sayt nomi">
          <Input value={value.brand.name} onChange={(e) => setGroup("brand", { name: e.target.value })} placeholder="Rustam's I/O" maxLength={60} />
        </Field>
      </Card>

      <HeroSettings
        value={value.hero}
        onChange={(patch) => setGroup("hero", patch)}
        photo={photo}
        onPhoto={(asset) => {
          setPhoto(asset);
          setGroup("hero", { photoId: asset?.id ?? null });
        }}
      />

      <Card title="Loyihalar">
        <div className="space-y-4">
          <Switch
            checked={value.projects.showAllOnHome}
            onChange={(showAllOnHome) => setGroup("projects", { showAllOnHome })}
            label="Barcha loyihalarni bosh sahifada ko'rsatish"
            description="Yoqilsa, alohida “Loyihalar” bo'limi yashiriladi"
          />
          {!value.projects.showAllOnHome && (
            <Field label="Bosh sahifadagi tanlangan loyihalar soni" hint="Ko'proq bo'lsa, “Hammasini ko'rish” tugmasi chiqadi">
              <Input
                type="number"
                min={1}
                max={50}
                value={value.projects.featuredLimit}
                onChange={(e) => setGroup("projects", { featuredLimit: Math.min(50, Math.max(1, Number(e.target.value) || 1)) })}
                className="w-32"
              />
            </Field>
          )}
        </div>
      </Card>

      <Card title="Bog'lanish" description="Sayt pastidagi forma va xabarlar qayerga borishi">
        <div className="space-y-4">
          <Field
            label="Xabarlar keladigan email"
            hint={
              smtpConfigured ? undefined : (
                <span className="flex items-center gap-1.5 text-amber-400">
                  <TriangleAlert className="size-3.5" /> SMTP sozlanmagan (.env) — xabarlar hozircha faqat admin panelga tushadi
                </span>
              )
            }
          >
            <Input type="email" value={value.contact.email} onChange={(e) => setGroup("contact", { email: e.target.value })} placeholder="you@example.com" />
          </Field>
          <LocalizedField label="Sarlavha" value={value.contact.title} onChange={(title) => setGroup("contact", { title })} />
          <LocalizedField label="Matn" value={value.contact.subtitle} onChange={(subtitle) => setGroup("contact", { subtitle })} multiline />
          <details className="rounded-xl border border-border p-4">
            <summary className="cursor-pointer text-sm font-semibold">Telegram xabarnoma (ixtiyoriy)</summary>
            <p className="mt-3 text-xs leading-relaxed text-muted">
              @BotFather orqali bot yarating, tokenni kiriting. Chat ID — o&apos;zingizning Telegram ID (@userinfobot dan olinadi). Botga avval /start yozing.
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Bot token">
                <Input
                  value={value.contact.telegramBotToken}
                  onChange={(e) => setGroup("contact", { telegramBotToken: e.target.value.trim() })}
                  placeholder="123456:ABC-DEF…"
                  className="font-mono text-sm"
                  autoComplete="off"
                />
              </Field>
              <Field label="Chat ID">
                <Input
                  value={value.contact.telegramChatId}
                  onChange={(e) => setGroup("contact", { telegramChatId: e.target.value.trim() })}
                  placeholder="123456789"
                  className="font-mono text-sm"
                />
              </Field>
            </div>
          </details>
        </div>
      </Card>

      <Card title="SEO" description="Google va ijtimoiy tarmoqlarda havola ostida chiqadigan tavsif">
        <LocalizedField label="Sayt tavsifi" value={value.seo.description} onChange={(description) => setGroup("seo", { description })} multiline />
      </Card>

      <SaveBar
        status={
          <label className="flex cursor-pointer items-center gap-2">
            <input type="checkbox" checked={retranslate} onChange={(e) => setRetranslate(e.target.checked)} className="accent-[var(--accent)]" />
            O&apos;zbekcha matnlarni o&apos;zgartirdim — RU/EN qayta tarjima qilinsin
          </label>
        }
      >
        <Button variant="primary" onClick={save} loading={pending} disabled={!dirty && !retranslate} icon={<Save className="size-4" />}>
          Saqlash
        </Button>
      </SaveBar>
    </div>
  );
}
