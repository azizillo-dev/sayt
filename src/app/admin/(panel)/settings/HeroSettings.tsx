"use client";

import { ArrowDown, ArrowUp, Plus, X } from "lucide-react";
import type { ReactNode } from "react";
import { ColorRow } from "@/components/admin/ColorRow";
import { LocalizedField } from "@/components/admin/LocalizedField";
import { MediaField } from "@/components/admin/media/MediaField";
import { Button, Card, Field, IconButton, Select, Switch } from "@/components/admin/ui";
import { cn } from "@/lib/cn";
import type { MediaAsset } from "@/lib/media/types";
import { heroBackground } from "@/lib/settings/hero";
import type { HeroColumn, SiteSettings } from "@/lib/settings/schema";

type Hero = SiteSettings["hero"];

interface Props {
  value: Hero;
  onChange: (patch: Partial<Hero>) => void;
  photo: MediaAsset | null;
  onPhoto: (asset: MediaAsset | null) => void;
}

const emptyColumn: HeroColumn = {
  title: { uz: "", ru: "", en: "" },
  items: { uz: "", ru: "", en: "" },
};

/** Like `Field`, but a plain block — these groups hold buttons, which must not sit inside a <label>. */
function Group({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div>
      <p className="text-sm font-semibold">{label}</p>
      {hint && <p className="mt-0.5 text-xs text-muted">{hint}</p>}
      <div className="mt-2">{children}</div>
    </div>
  );
}

const colorLabels = {
  from: "Chap yuqori (to'q)",
  via: "O'rta",
  to: "O'ng past (yorug')",
  label: "Sarlavhachalar rangi",
} as const;

/**
 * A scaled-down copy of the real hero: same background, same photo placement,
 * so colours and a new photo can be judged without leaving the page.
 */
function HeroPreview({ value, photo }: { value: Hero; photo: MediaAsset | null }) {
  const columns = value.columns.filter((c) => c.title.uz.trim() || c.items.uz.trim());

  return (
    <div
      className="relative flex h-40 flex-col justify-between overflow-hidden rounded-xl border border-border p-4 sm:h-48"
      style={{ background: heroBackground(value.gradient) }}
    >
      {photo && (
        <img
          src={photo.url}
          alt=""
          style={{ aspectRatio: `${photo.width}/${photo.height}` }}
          className={cn(
            "absolute bottom-0 right-0 h-[92%] w-auto object-contain",
            value.photoBlend && "hero-photo-blend",
          )}
        />
      )}
      <div className="relative min-w-0 max-w-[62%]">
        <p className="truncate font-display text-base font-bold text-white sm:text-xl">{value.name.uz || "Ism familiya"}</p>
        <p className="mt-0.5 truncate text-[11px] font-semibold" style={{ color: value.gradient.label }}>
          {value.role.uz || "Kasbi"}
        </p>
        <div className="mt-2 flex gap-3">
          {columns.slice(0, 3).map((column, i) => (
            <p key={i} className="truncate text-[10px] font-bold" style={{ color: value.gradient.label }}>
              {column.title.uz}
            </p>
          ))}
        </div>
      </div>
      <p className="relative max-w-[62%] truncate font-display text-xs font-bold text-white sm:text-sm">{value.tagline.uz}</p>
    </div>
  );
}

/** Fact columns: "Asosiy yo'nalishlar", "Tajriba", "Ta'lim"… */
function ColumnsEditor({ columns, onChange }: { columns: HeroColumn[]; onChange: (columns: HeroColumn[]) => void }) {
  const update = (index: number, patch: Partial<HeroColumn>) =>
    onChange(columns.map((c, i) => (i === index ? { ...c, ...patch } : c)));

  // Arrows rather than dragging — reliable on a phone.
  const move = (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= columns.length) return;
    const next = [...columns];
    [next[index], next[target]] = [next[target]!, next[index]!];
    onChange(next);
  };

  return (
    <div className="space-y-3">
      {columns.map((column, i) => (
        <div key={i} className="space-y-3 rounded-xl border border-border p-3">
          <div className="flex items-center gap-1">
            <span className="mr-auto text-xs font-bold uppercase tracking-wider text-muted">{i + 1}-ustun</span>
            <IconButton label="Yuqoriga" onClick={() => move(i, -1)} disabled={i === 0}>
              <ArrowUp className="size-4" />
            </IconButton>
            <IconButton label="Pastga" onClick={() => move(i, 1)} disabled={i === columns.length - 1}>
              <ArrowDown className="size-4" />
            </IconButton>
            <IconButton label="O'chirish" onClick={() => onChange(columns.filter((_, j) => j !== i))}>
              <X className="size-4" />
            </IconButton>
          </div>
          <LocalizedField label="Sarlavhasi" value={column.title} onChange={(title) => update(i, { title })} />
          <LocalizedField
            label="Ro'yxat"
            value={column.items}
            onChange={(items) => update(i, { items })}
            multiline
            hint="Har bir qatorga bitta yozuv"
          />
        </div>
      ))}
      {columns.length < 4 && (
        <Button size="sm" variant="ghost" icon={<Plus className="size-4" />} onClick={() => onChange([...columns, emptyColumn])}>
          Ustun qo&apos;shish
        </Button>
      )}
    </div>
  );
}

export function HeroSettings({ value, onChange, photo, onPhoto }: Props) {
  const profile = value.layout === "profile";

  return (
    <Card title="Bosh sahifa (hero)" description="Saytga kirganda birinchi ko'rinadigan bo'lim">
      <div className="space-y-5">
        <Field label="Ko'rinishi">
          <Select value={value.layout} onChange={(e) => onChange({ layout: e.target.value as Hero["layout"] })}>
            <option value="profile">Vizitka — rasm, ism va ma&apos;lumotlar</option>
            <option value="minimal">Minimal — bitta katta sarlavha</option>
          </Select>
        </Field>

        {profile ? (
          <>
            <HeroPreview value={value} photo={photo} />

            <div className="grid gap-5 sm:grid-cols-[13rem_1fr] sm:items-start">
              <Group label="Rasm" hint="Foni olib tashlangan PNG eng chiroyli chiqadi">
                {/* Narrow on a phone — a full-width square dropzone eats the screen. */}
                <MediaField value={photo} onChange={onPhoto} aspect="square" className="max-w-44 sm:max-w-none" />
              </Group>
              <div className="space-y-4">
                <LocalizedField label="Ism familiya" value={value.name} onChange={(name) => onChange({ name })} hint="Bo'sh qolsa sayt nomi chiqadi" />
                <LocalizedField label="Kasbi" value={value.role} onChange={(role) => onChange({ role })} />
                <LocalizedField label="Pastdagi yirik yozuv" value={value.tagline} onChange={(tagline) => onChange({ tagline })} />
              </div>
            </div>

            <Group label="Ma'lumot ustunlari" hint="Chiziqlar bilan ajratilgan holda chiqadi">
              <ColumnsEditor columns={value.columns} onChange={(columns) => onChange({ columns })} />
            </Group>

            <Switch
              checked={value.photoBlend}
              onChange={(photoBlend) => onChange({ photoBlend })}
              label="Rasm chetlarini fonga singdirish"
              description="To'rtburchak rasm ham kesib qo'yilgandek ko'rinadi"
            />

            <Group label="Fon ranglari">
              <div className="space-y-3">
                {(["from", "via", "to", "label"] as const).map((key) => (
                  <ColorRow
                    key={key}
                    label={colorLabels[key]}
                    value={value.gradient[key]}
                    onChange={(hex) => onChange({ gradient: { ...value.gradient, [key]: hex } })}
                  />
                ))}
              </div>
            </Group>
          </>
        ) : (
          <>
            <LocalizedField label="Sarlavha" value={value.title} onChange={(title) => onChange({ title })} />
            <LocalizedField label="Qo'shimcha matn" value={value.subtitle} onChange={(subtitle) => onChange({ subtitle })} multiline />
          </>
        )}

        <Switch
          checked={value.available}
          onChange={(available) => onChange({ available })}
          label="“Yangi loyihalarga ochiqman” belgisi"
          description="Yashil yonib-o'chuvchi nuqta bilan"
        />
        {value.available && (
          <LocalizedField label="Belgi matni" value={value.availableText} onChange={(availableText) => onChange({ availableText })} />
        )}
      </div>
    </Card>
  );
}
