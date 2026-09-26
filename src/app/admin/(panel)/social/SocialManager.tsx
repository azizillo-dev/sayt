"use client";

import { Pencil, Plus, Share2, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { Dialog } from "@/components/admin/Dialog";
import { MediaField } from "@/components/admin/media/MediaField";
import { Sortable } from "@/components/admin/Sortable";
import { useToast } from "@/components/admin/Toaster";
import { Button, Card, EmptyState, Field, IconButton, Input } from "@/components/admin/ui";
import { platformColor, SocialIcon } from "@/components/icons/SocialIcon";
import { deleteSocialLink, reorderSocialLinks, saveSocialLink } from "@/lib/admin/actions/social";
import type { SocialItem } from "@/lib/content/queries";
import type { MediaAsset } from "@/lib/media/types";
import { platformOptions } from "@/lib/social/platforms";
import { cn } from "@/lib/cn";

interface Draft {
  id: string | null;
  platform: string;
  label: string;
  url: string;
  icon: MediaAsset | null;
}

const placeholders: Record<string, string> = {
  email: "hello@example.com",
  phone: "+998 90 123 45 67",
  telegram: "https://t.me/username",
  instagram: "https://instagram.com/username",
  behance: "https://behance.net/username",
  dribbble: "https://dribbble.com/username",
};

const labelOf = (key: string) => platformOptions.find((p) => p.key === key)?.label ?? key;

export function SocialManager({ initial }: { initial: SocialItem[] }) {
  const toast = useToast();
  const [links, setLinks] = useState(initial);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [pending, startTransition] = useTransition();

  const save = () => {
    if (!draft) return;
    startTransition(async () => {
      const result = await saveSocialLink({
        id: draft.id,
        platform: draft.platform,
        label: draft.label,
        url: draft.url,
        iconId: draft.platform === "custom" ? (draft.icon?.id ?? null) : null,
      });
      if (!toast.result(result, "Saqlandi")) return;
      const saved: SocialItem = { id: result.data.id, platform: draft.platform, label: draft.label, url: draft.url, icon: draft.icon };
      setLinks((all) => (draft.id ? all.map((l) => (l.id === draft.id ? saved : l)) : [...all, saved]));
      setDraft(null);
    });
  };

  const reorder = (next: SocialItem[]) => {
    const previous = links;
    setLinks(next);
    startTransition(async () => {
      const result = await reorderSocialLinks(next.map((l) => l.id));
      if (!result.ok) {
        setLinks(previous);
        toast.show(result.error, "error");
      }
    });
  };

  const remove = (link: SocialItem) => {
    if (!window.confirm(`"${link.label || labelOf(link.platform)}" o'chirilsinmi?`)) return;
    startTransition(async () => {
      const result = await deleteSocialLink(link.id);
      if (toast.result(result, "O'chirildi")) setLinks((all) => all.filter((l) => l.id !== link.id));
    });
  };

  return (
    <Card
      title={`Tarmoqlar (${links.length})`}
      actions={
        <Button
          variant="primary"
          size="sm"
          icon={<Plus className="size-4" />}
          onClick={() => setDraft({ id: null, platform: "telegram", label: "", url: "", icon: null })}
        >
          Qo&apos;shish
        </Button>
      }
    >
      {links.length === 0 ? (
        <EmptyState icon={<Share2 className="size-6" />} title="Hali tarmoq qo'shilmagan" />
      ) : (
        <Sortable items={links} onReorder={reorder} className="space-y-2">
          {(link, handle) => (
            <div className="flex items-center gap-2 rounded-xl border border-border bg-bg/60 p-2 sm:gap-3 sm:pr-3">
              {handle}
              <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-surface" style={{ color: platformColor(link.platform) }}>
                <SocialIcon platform={link.platform} icon={link.icon} className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{link.label || labelOf(link.platform)}</p>
                <p className="truncate text-xs text-muted">{link.url}</p>
              </div>
              <IconButton label="Tahrirlash" onClick={() => setDraft({ ...link })}>
                <Pencil className="size-4" />
              </IconButton>
              <IconButton label="O'chirish" onClick={() => remove(link)} className="hover:text-red-400">
                <Trash2 className="size-4" />
              </IconButton>
            </div>
          )}
        </Sortable>
      )}

      <Dialog
        open={draft !== null}
        onClose={() => setDraft(null)}
        title={draft?.id ? "Tahrirlash" : "Yangi tarmoq"}
        footer={
          <>
            <Button variant="ghost" onClick={() => setDraft(null)}>
              Bekor qilish
            </Button>
            <Button variant="primary" onClick={save} loading={pending}>
              Saqlash
            </Button>
          </>
        }
      >
        {draft && (
          <div className="space-y-5">
            <div>
              <span className="mb-2 block text-sm font-semibold">Platforma</span>
              <div className="grid grid-cols-5 gap-2 sm:grid-cols-7">
                {platformOptions.map(({ key, label }) => (
                  <button
                    key={key}
                    type="button"
                    title={label}
                    aria-label={label}
                    aria-pressed={draft.platform === key}
                    onClick={() => setDraft({ ...draft, platform: key })}
                    style={{ color: platformColor(key) }}
                    className={cn(
                      "grid aspect-square place-items-center rounded-xl border transition-colors",
                      draft.platform === key ? "border-accent bg-accent/10" : "border-border hover:border-muted",
                    )}
                  >
                    <SocialIcon platform={key} className="size-5" />
                  </button>
                ))}
              </div>
              <p className="mt-2 text-sm text-muted">{labelOf(draft.platform)}</p>
            </div>

            {draft.platform === "custom" && (
              <Field label="Ikonka" hint="Kvadrat SVG yoki PNG">
                <MediaField value={draft.icon} onChange={(icon) => setDraft({ ...draft, icon })} aspect="square" className="max-w-32" allowLossless={false} />
              </Field>
            )}

            <Field label={draft.platform === "email" ? "Email" : draft.platform === "phone" ? "Telefon raqam" : "Havola"}>
              <Input
                value={draft.url}
                onChange={(e) => setDraft({ ...draft, url: e.target.value })}
                placeholder={placeholders[draft.platform] ?? "https://…"}
              />
            </Field>
            <Field label="Nomi (ixtiyoriy)" hint="Sichqoncha ustiga kelganda ko'rinadi">
              <Input value={draft.label} onChange={(e) => setDraft({ ...draft, label: e.target.value })} placeholder={labelOf(draft.platform)} />
            </Field>
          </div>
        )}
      </Dialog>
    </Card>
  );
}
