"use client";

import { Save, TriangleAlert } from "lucide-react";
import { useState, useTransition } from "react";
import { useDirtyState, useSaveShortcut, useUnsavedGuard } from "@/components/admin/editor/hooks";
import { LocalizedField } from "@/components/admin/LocalizedField";
import { useToast } from "@/components/admin/Toaster";
import { Button, Card, Field, Input, SaveBar, Switch } from "@/components/admin/ui";
import { saveGeneralSettings, sendTestMail } from "@/lib/admin/actions/settings";
import type { MediaAsset } from "@/lib/media/types";
import type { SiteSettings } from "@/lib/settings/schema";
import { HeroSettings } from "./HeroSettings";

type General = Pick<SiteSettings, "brand" | "hero" | "projects" | "contact" | "seo">;

interface Props {
  initial: General;
  /** Whether SMTP_* environment variables provide a mailbox when the panel has none. */
  smtpConfigured: boolean;
  /** Resolved from `hero.photoId` — settings store only the id. */
  heroPhoto: MediaAsset | null;
  heroBackground: MediaAsset | null;
}

export function GeneralSettingsForm({ initial, heroPhoto, heroBackground, smtpConfigured }: Props) {
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const [retranslate, setRetranslate] = useState(false);
  const [photo, setPhoto] = useState(heroPhoto);
  const [backdrop, setBackdrop] = useState(heroBackground);
  const { value, setValue, dirty, markSaved } = useDirtyState(initial);
  const [testing, startTest] = useTransition();
  const mailReady = Boolean(value.contact.smtpUser && value.contact.smtpPassword) || smtpConfigured;

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
        background={backdrop}
        onBackground={(asset) => {
          setBackdrop(asset);
          setGroup("hero", { backgroundId: asset?.id ?? null });
        }}
      />

      <Card title="Eski loyihalar arxivi" description="Bosh sahifadagi yangi portfolio bo'limlari Portfolio menyusidan boshqariladi.">
        <Switch
          checked={!value.projects.showAllOnHome}
          onChange={(showArchive) => setGroup("projects", { showAllOnHome: !showArchive })}
          label="Eski loyihalar sahifasini menyuda ko'rsatish"
          description="Yoqilsa, avvalgi maqola ko'rinishidagi loyihalar Ko'proq menyusida qoladi"
        />
      </Card>

      <Card title="Bog'lanish" description="Sayt pastidagi forma va xabarlar qayerga borishi">
        <div className="space-y-4">
          <Field
            label="Xabarlar keladigan email"
            hint={
              mailReady ? undefined : (
                <span className="flex items-center gap-1.5 text-amber-400">
                  <TriangleAlert className="size-3.5" /> Yuboruvchi pochta kiritilmagan — xabarlar hozircha faqat admin panelga tushadi
                </span>
              )
            }
          >
            <Input type="email" value={value.contact.email} onChange={(e) => setGroup("contact", { email: e.target.value })} placeholder="you@example.com" />
          </Field>
          <div className="rounded-xl border border-border p-4">
            <p className="text-sm font-semibold">Xat yuboruvchi pochta</p>
            <p className="mt-1 text-xs leading-relaxed text-muted">
              Sayt xabarlarni shu Gmail orqali jo&apos;natadi. Parol — Gmail&apos;ning oddiy paroli emas, 16 xonali ilova paroli:
              Google hisobida 2 bosqichli tekshiruvni yoqing, so&apos;ng{" "}
              <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer" className="text-accent underline">
                myaccount.google.com/apppasswords
              </a>{" "}
              sahifasida yangi parol yarating.
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Gmail manzili">
                <Input
                  type="email"
                  value={value.contact.smtpUser}
                  onChange={(e) => setGroup("contact", { smtpUser: e.target.value.trim() })}
                  placeholder="sayt.xabarlar@gmail.com"
                  autoComplete="off"
                />
              </Field>
              <Field label="Ilova paroli (16 xonali)">
                <Input
                  type="password"
                  value={value.contact.smtpPassword}
                  onChange={(e) => setGroup("contact", { smtpPassword: e.target.value.replace(/\s+/g, "") })}
                  placeholder="abcdefghijklmnop"
                  className="font-mono text-sm"
                  autoComplete="new-password"
                />
              </Field>
            </div>
            <details className="mt-4">
              <summary className="cursor-pointer text-xs font-semibold text-muted">Gmail emas, boshqa pochta</summary>
              <div className="mt-3 grid gap-4 sm:grid-cols-[1fr_8rem]">
                <Field label="SMTP server">
                  <Input value={value.contact.smtpHost} onChange={(e) => setGroup("contact", { smtpHost: e.target.value.trim() })} placeholder="smtp.gmail.com" />
                </Field>
                <Field label="Port">
                  <Input
                    type="number"
                    value={value.contact.smtpPort}
                    onChange={(e) => setGroup("contact", { smtpPort: Number(e.target.value) || 465 })}
                    placeholder="465"
                  />
                </Field>
              </div>
            </details>
            <Button
              type="button"
              size="sm"
              className="mt-4"
              loading={testing}
              disabled={!mailReady}
              onClick={() =>
                startTest(async () => {
                  const result = await sendTestMail(value.contact);
                  toast.result(result, "Sinov xati yuborildi — pochtangizni tekshiring");
                })
              }
            >
              Sinov xati yuborish
            </Button>
          </div>
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

      <Card
        title="SEO — Google qidiruvi"
        description="Google'da “dizayner”, “logo dizayn” deb qidirganlarga sayt shu sarlavha va tavsif bilan chiqadi. Bo'sh qolsa, ism va “grafik dizayner — logo, brending, SMM dizayn” matni ishlatiladi."
      >
        <div className="space-y-4">
          <LocalizedField label="Google'dagi sarlavha (60 belgigacha)" value={value.seo.title} onChange={(title) => setGroup("seo", { title })} />
          <LocalizedField label="Sayt tavsifi (160 belgigacha)" value={value.seo.description} onChange={(description) => setGroup("seo", { description })} multiline />
        </div>
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
