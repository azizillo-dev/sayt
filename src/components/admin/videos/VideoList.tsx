"use client";

import { ArrowDown, ArrowUp, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Picture } from "@/components/media/Picture";
import { useToast } from "@/components/admin/Toaster";
import { Button, buttonClass, Card } from "@/components/admin/ui";
import { deleteVideoItem, reorderVideoItems } from "@/lib/admin/actions/videos";
import type { MediaAsset } from "@/lib/media/types";

interface Item { id: string; title: string; isPublished: boolean; cover: MediaAsset | null }

export function VideoList({ items }: { items: Item[] }) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const move = (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= items.length) return;
    const ids = items.map((item) => item.id);
    [ids[index], ids[target]] = [ids[target]!, ids[index]!];
    startTransition(async () => { if (toast.result(await reorderVideoItems(ids), "Tartib saqlandi")) router.refresh(); });
  };
  const remove = (item: Item) => {
    if (!window.confirm(`"${item.title}" videosini o'chirasizmi?`)) return;
    startTransition(async () => { if (toast.result(await deleteVideoItem(item.id), "Video o'chirildi")) router.refresh(); });
  };

  return <Card title="Videolar" description={`${items.length} ta video`}>
    {items.length ? <div className="space-y-2">{items.map((item, index) => <div key={item.id} className="flex min-w-0 items-center gap-2 rounded-xl border border-border p-2 sm:gap-3">
      <div className="relative h-16 w-11 shrink-0 overflow-hidden rounded-lg bg-bg">{item.cover && <Picture asset={item.cover} fill sizes="44px" />}</div>
      <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{item.title}</p><p className="text-xs text-muted">{item.isPublished ? "Saytda ko'rinadi" : "Yashirilgan"}</p></div>
      <div className="flex shrink-0 items-center gap-0.5">
        <Button size="sm" variant="ghost" aria-label="Yuqoriga" disabled={pending || index === 0} onClick={() => move(index, -1)}><ArrowUp className="size-4" /></Button>
        <Button size="sm" variant="ghost" aria-label="Pastga" disabled={pending || index === items.length - 1} onClick={() => move(index, 1)}><ArrowDown className="size-4" /></Button>
        <Link href={`/admin/videos/${item.id}`} className={buttonClass("ghost", "sm")} aria-label="Tahrirlash"><Pencil className="size-4" /></Link>
        <Button size="sm" variant="danger" aria-label="O'chirish" disabled={pending} onClick={() => remove(item)}><Trash2 className="size-4" /></Button>
      </div>
    </div>)}</div> : <p className="text-sm text-muted">Hozircha video qo'shilmagan.</p>}
  </Card>;
}
