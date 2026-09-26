"use client";

import { ExternalLink, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { MediaField } from "@/components/admin/media/MediaField";
import { useToast } from "@/components/admin/Toaster";
import { Button, buttonClass, Card, Field, Input, SaveBar, Switch } from "@/components/admin/ui";
import { saveProject } from "@/lib/admin/actions/projects";
import type { LocalizedDocs } from "@/lib/content/localize";
import type { MediaMap } from "@/lib/media/types";
import { slugify } from "@/lib/slug";
import { useDirtyState, useMediaMap, useSaveShortcut, useUnsavedGuard } from "./hooks";
import { LocalizedDocsEditor } from "./LocalizedDocsEditor";
import { RetranslateToggle } from "./RetranslateToggle";
import { SlugInput } from "./SlugInput";

export interface ProjectFormValue {
  id: string | null;
  slug: string;
  coverId: string | null;
  publishedAt: string;
  isPublished: boolean;
  isFeatured: boolean;
  docs: LocalizedDocs;
}

export function ProjectEditor({ initial, media: initialMedia }: { initial: ProjectFormValue; media: MediaMap }) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const [media, addMedia] = useMediaMap(initialMedia);
  const [retranslate, setRetranslate] = useState(false);
  const { value, setValue, dirty, markSaved } = useDirtyState(initial);
  const set = (patch: Partial<ProjectFormValue>) => setValue((v) => ({ ...v, ...patch }));

  useUnsavedGuard(dirty);

  const save = () =>
    startTransition(async () => {
      const result = await saveProject({ ...value, slug: slugify(value.slug), retranslate });
      if (!toast.result(result, "Loyiha saqlandi")) return;
      const saved = { ...value, id: result.data.id, slug: result.data.slug, docs: result.data.docs };
      markSaved(saved);
      setRetranslate(false);
      if (!value.id) router.replace(`/admin/projects/${result.data.id}`);
    });
  useSaveShortcut(() => !pending && save());

  const cover = value.coverId ? (media[value.coverId] ?? null) : null;

  return (
    <div className="grid gap-4 sm:gap-6 xl:grid-cols-[1fr_340px]">
      <Card className="order-2 min-w-0 xl:order-1">
        <LocalizedDocsEditor
          docs={value.docs}
          onChange={(docs) => set({ docs })}
          media={media}
          onMedia={addMedia}
        />
      </Card>

      <div className="order-1 min-w-0 space-y-4 sm:space-y-6 xl:order-2">
        <Card title="Muqova rasmi" description="Kartochkada va loyiha tepasida chiqadi">
          <MediaField
            value={cover}
            onChange={(asset) => {
              if (asset) addMedia(asset);
              set({ coverId: asset?.id ?? null });
            }}
          />
        </Card>

        <Card title="Sozlamalar">
          <div className="space-y-4">
            <Field label="Slug (URL)" hint="Bo'sh qolsa sarlavhadan yasaladi">
              <SlugInput value={value.slug} onChange={(slug) => set({ slug })} placeholder={slugify(value.docs.uz.title) || "my-project"} />
            </Field>
            <Field label="Sana">
              <Input type="date" value={value.publishedAt} onChange={(e) => set({ publishedAt: e.target.value })} />
            </Field>
            <div className="space-y-3 border-t border-border pt-4">
              <Switch checked={value.isPublished} onChange={(isPublished) => set({ isPublished })} label="Chop etilgan" description="O'chirilsa, saytda ko'rinmaydi" />
              <Switch
                checked={value.isFeatured}
                onChange={(isFeatured) => set({ isFeatured })}
                label="Tanlangan ish"
                description="Bosh sahifadagi eng sara ishlar qatorida"
              />
            </div>
          </div>
        </Card>
      </div>

      <div className="order-3 xl:col-span-2">
        <SaveBar status={<RetranslateToggle checked={retranslate} onChange={setRetranslate} />}>
          {value.id && value.isPublished && !dirty && (
            <a href={`/uz/projects/${value.slug}`} target="_blank" rel="noreferrer" className={buttonClass("ghost")}>
              <ExternalLink className="size-4" />
              Saytda ko&apos;rish
            </a>
          )}
          <Button variant="primary" onClick={save} loading={pending} icon={<Save className="size-4" />} className={dirty ? "ring-2 ring-accent/40" : undefined}>
            {pending && (retranslate || !value.docs.ru.title || !value.docs.en.title) ? "Tarjima qilinmoqda…" : "Saqlash"}
          </Button>
        </SaveBar>
      </div>
    </div>
  );
}
