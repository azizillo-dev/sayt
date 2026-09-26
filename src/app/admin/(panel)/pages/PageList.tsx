"use client";

import { Eye, EyeOff, FileText, Menu, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { Sortable } from "@/components/admin/Sortable";
import { useToast } from "@/components/admin/Toaster";
import { EmptyState, IconButton } from "@/components/admin/ui";
import { deletePage, reorderPages, setPageFlags } from "@/lib/admin/actions/pages";
import type { AdminPageRow } from "@/lib/admin/queries";
import { cn } from "@/lib/cn";

export function PageList({ initial }: { initial: AdminPageRow[] }) {
  const toast = useToast();
  const [pages, setPages] = useState(initial);
  const [, startTransition] = useTransition();

  const patch = (id: string, change: Partial<AdminPageRow>) => setPages((all) => all.map((p) => (p.id === id ? { ...p, ...change } : p)));

  const toggle = (page: AdminPageRow, flag: "isPublished" | "showInMenu") => {
    const value = !page[flag];
    patch(page.id, { [flag]: value });
    startTransition(async () => {
      const result = await setPageFlags(page.id, { [flag]: value });
      if (!result.ok) {
        patch(page.id, { [flag]: !value });
        toast.show(result.error, "error");
      }
    });
  };

  const reorder = (next: AdminPageRow[]) => {
    const previous = pages;
    setPages(next);
    startTransition(async () => {
      const result = await reorderPages(next.map((p) => p.id));
      if (!result.ok) {
        setPages(previous);
        toast.show(result.error, "error");
      }
    });
  };

  const remove = (page: AdminPageRow) => {
    if (!window.confirm(`"${page.title}" sahifasini o'chirasizmi?`)) return;
    startTransition(async () => {
      const result = await deletePage(page.id);
      if (toast.result(result, "Sahifa o'chirildi")) setPages((all) => all.filter((p) => p.id !== page.id));
    });
  };

  if (pages.length === 0) {
    return (
      <EmptyState icon={<FileText className="size-6" />} title="Qo'shimcha sahifalar yo'q">
        <Link href="/admin/pages/new" className="font-semibold text-accent">
          Sahifa qo&apos;shish →
        </Link>
      </EmptyState>
    );
  }

  return (
    <Sortable items={pages} onReorder={reorder} className="space-y-2">
      {(page, handle) => (
        <div className={cn("flex items-center gap-2 rounded-2xl border border-border bg-surface p-2 sm:gap-3 sm:pr-3", !page.isPublished && "opacity-60")}>
          {handle}
          <Link href={`/admin/pages/${page.id}`} className="min-w-0 flex-1 py-2">
            <p className="truncate font-semibold hover:text-accent">{page.title}</p>
            <p className="truncate text-xs text-muted">/{page.slug}</p>
          </Link>
          <IconButton
            label={page.showInMenu ? "Menyudan olish" : "Menyuga qo'shish"}
            onClick={() => toggle(page, "showInMenu")}
            className={page.showInMenu ? "text-accent" : undefined}
          >
            <Menu className="size-4" />
          </IconButton>
          <IconButton label={page.isPublished ? "Yashirish" : "Chop etish"} onClick={() => toggle(page, "isPublished")}>
            {page.isPublished ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
          </IconButton>
          <Link href={`/admin/pages/${page.id}`} aria-label="Tahrirlash" className="hidden size-9 place-items-center rounded-lg text-muted hover:bg-white/5 hover:text-fg sm:grid">
            <Pencil className="size-4" />
          </Link>
          <IconButton label="O'chirish" onClick={() => remove(page)} className="hover:text-red-400">
            <Trash2 className="size-4" />
          </IconButton>
        </div>
      )}
    </Sortable>
  );
}
