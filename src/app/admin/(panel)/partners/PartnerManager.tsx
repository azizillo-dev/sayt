"use client";

import { Handshake, Link2, Pencil, Plus, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { Dialog } from "@/components/admin/Dialog";
import { MediaField } from "@/components/admin/media/MediaField";
import { MediaPreview } from "@/components/admin/media/MediaPreview";
import { Sortable } from "@/components/admin/Sortable";
import { useToast } from "@/components/admin/Toaster";
import { Button, Card, EmptyState, Field, IconButton, Input, Switch } from "@/components/admin/ui";
import { deletePartner, reorderPartners, savePartner } from "@/lib/admin/actions/partners";
import type { PartnerItem } from "@/lib/content/queries";
import type { MediaAsset } from "@/lib/media/types";

interface Draft {
  id: string | null;
  name: string;
  logo: MediaAsset | null;
  url: string;
  showInMarquee: boolean;
}

const emptyDraft: Draft = { id: null, name: "", logo: null, url: "", showInMarquee: true };

export function PartnerManager({ initial, marqueeCount }: { initial: PartnerItem[]; marqueeCount: number }) {
  const toast = useToast();
  const [partners, setPartners] = useState(initial);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [pending, startTransition] = useTransition();

  const edit = (p: PartnerItem) =>
    setDraft({ id: p.id, name: p.name, logo: p.logo, url: p.url ?? "", showInMarquee: p.showInMarquee });

  const save = () => {
    if (!draft) return;
    startTransition(async () => {
      const result = await savePartner({
        id: draft.id,
        name: draft.name,
        logoId: draft.logo?.id ?? null,
        url: draft.url.trim(),
        showInMarquee: draft.showInMarquee,
      });
      if (!toast.result(result, draft.id ? "Hamkor yangilandi" : "Hamkor qo'shildi")) return;
      const saved: PartnerItem = {
        id: result.data.id,
        name: draft.name,
        logo: draft.logo,
        url: draft.url.trim() || null,
        showInMarquee: draft.showInMarquee,
      };
      setPartners((all) => (draft.id ? all.map((p) => (p.id === draft.id ? saved : p)) : [...all, saved]));
      setDraft(null);
    });
  };

  const reorder = (next: PartnerItem[]) => {
    const previous = partners;
    setPartners(next);
    startTransition(async () => {
      const result = await reorderPartners(next.map((p) => p.id));
      if (!result.ok) {
        setPartners(previous);
        toast.show(result.error, "error");
      }
    });
  };

  const remove = (p: PartnerItem) => {
    if (!window.confirm(`"${p.name}" hamkorini o'chirasizmi?`)) return;
    startTransition(async () => {
      const result = await deletePartner(p.id);
      if (toast.result(result, "Hamkor o'chirildi")) setPartners((all) => all.filter((x) => x.id !== p.id));
    });
  };

  return (
    <Card
      title={`Logotiplar (${partners.length})`}
      description={`Tartibni surib o'zgartiring. Bosh sahifada birinchi ${marqueeCount} tasi aylanadi.`}
      actions={
        <Button variant="primary" size="sm" icon={<Plus className="size-4" />} onClick={() => setDraft(emptyDraft)}>
          Qo&apos;shish
        </Button>
      }
    >
      {partners.length === 0 ? (
        <EmptyState icon={<Handshake className="size-6" />} title="Hamkorlar hali qo'shilmagan" />
      ) : (
        <Sortable items={partners} onReorder={reorder} className="space-y-2">
          {(p, handle, index) => (
            <div className="flex items-center gap-2 rounded-xl border border-border bg-bg/60 p-2 sm:gap-3 sm:pr-3">
              {handle}
              <span className="hidden w-6 text-center text-xs tabular-nums text-muted sm:block">{index + 1}</span>
              <div className="grid h-11 w-16 shrink-0 place-items-center overflow-hidden rounded-lg bg-white p-1.5 sm:h-12 sm:w-20">
                {p.logo ? <MediaPreview asset={p.logo} contain /> : <span className="text-[10px] font-bold text-black">{p.name}</span>}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{p.name}</p>
                <p className="flex items-center gap-1 truncate text-xs text-muted">
                  {p.url ? (
                    <>
                      <Link2 className="size-3" /> {p.url.replace(/^https?:\/\//, "")}
                    </>
                  ) : (
                    "havolasiz"
                  )}
                  {!p.showInMarquee && " · aylanmaydi"}
                </p>
              </div>
              <IconButton label="Tahrirlash" onClick={() => edit(p)}>
                <Pencil className="size-4" />
              </IconButton>
              <IconButton label="O'chirish" onClick={() => remove(p)} className="hover:text-red-400">
                <Trash2 className="size-4" />
              </IconButton>
            </div>
          )}
        </Sortable>
      )}

      <Dialog
        open={draft !== null}
        onClose={() => setDraft(null)}
        title={draft?.id ? "Hamkorni tahrirlash" : "Yangi hamkor"}
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
            <Field label="Logotip" hint="Shaffof fonli PNG yoki SVG eng yaxshi natija beradi">
              <MediaField value={draft.logo} onChange={(logo) => setDraft({ ...draft, logo })} aspect="video" allowLossless={false} />
            </Field>
            <Field label="Nomi">
              <Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="Kompaniya nomi" />
            </Field>
            <Field label="Havola (ixtiyoriy)" hint="Faqat “Barcha hamkorlar” sahifasida bosiladigan bo'ladi">
              <Input value={draft.url} onChange={(e) => setDraft({ ...draft, url: e.target.value })} placeholder="https://…" type="url" />
            </Field>
            <Switch checked={draft.showInMarquee} onChange={(showInMarquee) => setDraft({ ...draft, showInMarquee })} label="Bosh sahifada aylansin" />
          </div>
        )}
      </Dialog>
    </Card>
  );
}
