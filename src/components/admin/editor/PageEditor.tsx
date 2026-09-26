"use client";

import { ExternalLink, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { MediaField } from "@/components/admin/media/MediaField";
import { useToast } from "@/components/admin/Toaster";
import { Button, buttonClass, Card, Field, SaveBar, Switch } from "@/components/admin/ui";
import { savePage } from "@/lib/admin/actions/pages";
import type { LocalizedDocs } from "@/lib/content/localize";
import type { MediaMap } from "@/lib/media/types";
import { slugify } from "@/lib/slug";
import { useDirtyState, useMediaMap, useSaveShortcut, useUnsavedGuard } from "./hooks";
import { LocalizedDocsEditor } from "./LocalizedDocsEditor";
import { RetranslateToggle } from "./RetranslateToggle";
import { SlugInput } from "./SlugInput";

export interface PageFormValue {
  id: string | null;
  kind: "about" | "custom";
  slug: string;
  imageId: string | null;
  isPublished: boolean;
  showInMenu: boolean;
  docs: LocalizedDocs;
}

export function PageEditor({ initial, media: initialMedia }: { initial: PageFormValue; media: MediaMap }) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const [media, addMedia] = useMediaMap(initialMedia);
  const [retranslate, setRetranslate] = useState(false);
  const { value, setValue, dirty, markSaved } = useDirtyState(initial);
  const set = (patch: Partial<PageFormValue>) => setValue((v) => ({ ...v, ...patch }));
  const isAbout = value.kind === "about";

  useUnsavedGuard(dirty);

  const save = () =>
    startTransition(async () => {
      const result = await savePage({ ...value, slug: slugify(value.slug), retranslate });
      if (!toast.result(result, "Sahifa saqlandi")) return;
      markSaved({ ...value, id: result.data.id, slug: result.data.slug, docs: result.data.docs });
      setRetranslate(false);
      // A new custom page gets its own URL; About always stays at /admin/about.
      if (!value.id && !isAbout) router.replace(`/admin/pages/${result.data.id}`);
    });
  useSaveShortcut(() => !pending && save());

  const image = value.imageId ? (media[value.imageId] ?? null) : null;
  const publicPath = `/uz/${isAbout ? "about" : value.slug}`;

  return (
    <div className="grid gap-4 sm:gap-6 xl:grid-cols-[1fr_340px]">
      <Card className="order-2 min-w-0 xl:order-1">
        <LocalizedDocsEditor
          docs={value.docs}
          onChange={(docs) => set({ docs })}
          media={media}
          onMedia={addMedia}
          excerptLabel={isAbout ? "Qisqa tanishtiruv" : "Qisqa tavsif"}
        />
      </Card>

      <div className="order-1 min-w-0 space-y-4 sm:space-y-6 xl:order-2">
        <Card
          title={isAbout ? "Profil rasmi" : "Rasm (ixtiyoriy)"}
          description={isAbout ? "Dumaloq doira ichida chiqadi — yuz markazda bo'lsin" : "Sarlavha tepasida dumaloq ko'rinishda"}
        >
          <MediaField
            value={image}
            aspect="square"
            round
            className="mx-auto max-w-40 sm:max-w-52"
            allowLossless={false}
            onChange={(asset) => {
              if (asset) addMedia(asset);
              set({ imageId: asset?.id ?? null });
            }}
          />
        </Card>

        <Card title="Sozlamalar">
          <div className="space-y-4">
            {!isAbout && (
              <Field label="Slug (URL)" hint="Bo'sh qolsa sarlavhadan yasaladi">
                <SlugInput value={value.slug} onChange={(slug) => set({ slug })} placeholder={slugify(value.docs.uz.title) || "sahifa"} />
              </Field>
            )}
            <div className="space-y-3">
              <Switch checked={value.isPublished} onChange={(isPublished) => set({ isPublished })} label="Chop etilgan" description="O'chirilsa, saytda ko'rinmaydi" />
              {!isAbout && (
                <Switch checked={value.showInMenu} onChange={(showInMenu) => set({ showInMenu })} label="Menyuda ko'rsatish" description={"\"Ko'proq\" menyusida chiqadi"} />
              )}
            </div>
          </div>
        </Card>
      </div>

      <div className="order-3 xl:col-span-2">
        <SaveBar status={<RetranslateToggle checked={retranslate} onChange={setRetranslate} />}>
          {value.id && value.isPublished && !dirty && (
            <a href={publicPath} target="_blank" rel="noreferrer" className={buttonClass("ghost")}>
              <ExternalLink className="size-4" />
              Saytda ko&apos;rish
            </a>
          )}
          <Button variant="primary" onClick={save} loading={pending} icon={<Save className="size-4" />} className={dirty ? "ring-2 ring-accent/40" : undefined}>
            Saqlash
          </Button>
        </SaveBar>
      </div>
    </div>
  );
}
