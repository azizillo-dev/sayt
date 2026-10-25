"use client";

import { ArrowDown, ArrowUp, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Picture } from "@/components/media/Picture";
import { useToast } from "@/components/admin/Toaster";
import { Button, buttonClass, Card } from "@/components/admin/ui";
import { deletePortfolioItem, reorderPortfolioItems } from "@/lib/admin/actions/portfolio";
import type { MediaAsset } from "@/lib/media/types";
import { portfolioCategories } from "@/lib/portfolio/categories";

interface Item { id: string; title: string; category: string; isPublished: boolean; cover: MediaAsset | null }

export function PortfolioList({ items }: { items: Item[] }) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();

  const remove = (item: Item) => {
    if (!window.confirm(`"${item.title}" ishini o'chirasizmi?`)) return;
    startTransition(async () => {
      if (toast.result(await deletePortfolioItem(item.id), "Ish o'chirildi")) router.refresh();
    });
  };
  const move = (category: string, index: number, delta: number) => {
    const group = items.filter((item) => item.category === category);
    const target = index + delta;
    if (target < 0 || target >= group.length) return;
    const ids = group.map((item) => item.id);
    [ids[index], ids[target]] = [ids[target]!, ids[index]!];
    startTransition(async () => {
      if (toast.result(await reorderPortfolioItems(category, ids), "Tartib saqlandi")) router.refresh();
    });
  };

  return <div className="space-y-5">
    {portfolioCategories.map((category) => {
      const group = items.filter((item) => item.category === category.slug);
      return <Card key={category.slug} title={category.title} description={`${group.length} ta ish`}>
        {group.length === 0 ? <p className="text-sm text-muted">Hozircha ish qo'shilmagan.</p> :
          <div className="space-y-2">
            {group.map((item, index) => <div key={item.id} className="flex min-w-0 items-center gap-3 rounded-xl border border-border p-2">
              <div className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-bg">
                {item.cover && <Picture asset={item.cover} fill sizes="56px" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{item.title}</p>
                <p className="text-xs text-muted">{item.isPublished ? "Saytda ko'rinadi" : "Yashirilgan"}</p>
              </div>
              <div className="flex shrink-0 items-center gap-0.5">
                <Button size="sm" variant="ghost" aria-label="Yuqoriga" disabled={pending || index === 0} onClick={() => move(category.slug, index, -1)}><ArrowUp className="size-4" /></Button>
                <Button size="sm" variant="ghost" aria-label="Pastga" disabled={pending || index === group.length - 1} onClick={() => move(category.slug, index, 1)}><ArrowDown className="size-4" /></Button>
                <Link href={`/admin/portfolio/${item.id}`} className={buttonClass("ghost", "sm")} aria-label="Tahrirlash"><Pencil className="size-4" /></Link>
                <Button size="sm" variant="danger" aria-label="O'chirish" disabled={pending} onClick={() => remove(item)}><Trash2 className="size-4" /></Button>
              </div>
            </div>)}
          </div>}
      </Card>;
    })}
  </div>;
}
