"use client";

import { Eye, EyeOff, FolderKanban, Pencil, Star, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { MediaPreview } from "@/components/admin/media/MediaPreview";
import { Sortable } from "@/components/admin/Sortable";
import { useToast } from "@/components/admin/Toaster";
import { EmptyState, IconButton } from "@/components/admin/ui";
import { deleteProject, reorderProjects, setProjectFlags } from "@/lib/admin/actions/projects";
import type { AdminProjectRow } from "@/lib/admin/queries";
import { formatDate } from "@/lib/i18n/format";
import { cn } from "@/lib/cn";

export function ProjectList({ initial }: { initial: AdminProjectRow[] }) {
  const toast = useToast();
  const [projects, setProjects] = useState(initial);
  const [, startTransition] = useTransition();

  const patch = (id: string, change: Partial<AdminProjectRow>) =>
    setProjects((all) => all.map((p) => (p.id === id ? { ...p, ...change } : p)));

  // Optimistic: update the list immediately, roll back if the server refuses.
  const toggle = (project: AdminProjectRow, flag: "isPublished" | "isFeatured") => {
    const value = !project[flag];
    patch(project.id, { [flag]: value });
    startTransition(async () => {
      const result = await setProjectFlags(project.id, { [flag]: value });
      if (!result.ok) {
        patch(project.id, { [flag]: !value });
        toast.show(result.error, "error");
      }
    });
  };

  const reorder = (next: AdminProjectRow[]) => {
    const previous = projects;
    setProjects(next);
    startTransition(async () => {
      const result = await reorderProjects(next.map((p) => p.id));
      if (!result.ok) {
        setProjects(previous);
        toast.show(result.error, "error");
      }
    });
  };

  const remove = (project: AdminProjectRow) => {
    if (!window.confirm(`"${project.title}" loyihasini butunlay o'chirasizmi? Bu amalni qaytarib bo'lmaydi.`)) return;
    startTransition(async () => {
      const result = await deleteProject(project.id);
      if (toast.result(result, "Loyiha o'chirildi")) setProjects((all) => all.filter((p) => p.id !== project.id));
    });
  };

  if (projects.length === 0) {
    return (
      <EmptyState icon={<FolderKanban className="size-6" />} title="Hali loyiha qo'shilmagan">
        <Link href="/admin/projects/new" className="font-semibold text-accent">
          Birinchi loyihani qo&apos;shish →
        </Link>
      </EmptyState>
    );
  }

  return (
    <Sortable items={projects} onReorder={reorder} className="space-y-2">
      {(project, handle, index) => (
        <div
          className={cn(
            "flex items-center gap-2 rounded-2xl border border-border bg-surface p-2 transition-opacity sm:gap-3 sm:pr-3",
            !project.isPublished && "opacity-60",
          )}
        >
          {handle}
          <span className="hidden w-6 text-center text-xs tabular-nums text-muted sm:block">{index + 1}</span>
          <div className="h-12 w-16 shrink-0 overflow-hidden rounded-lg bg-bg sm:h-14 sm:w-20">
            {project.cover && <MediaPreview asset={project.cover} />}
          </div>
          <Link href={`/admin/projects/${project.id}`} className="min-w-0 flex-1">
            <p className="truncate font-semibold hover:text-accent">{project.title}</p>
            <p className="truncate text-xs text-muted">
              {formatDate(project.publishedAt, "uz")} · /{project.slug}
            </p>
          </Link>
          <IconButton
            label={project.isFeatured ? "Tanlanganlardan olish" : "Tanlanganlarga qo'shish"}
            onClick={() => toggle(project, "isFeatured")}
            className={project.isFeatured ? "text-amber-400 hover:text-amber-300" : undefined}
          >
            <Star className={cn("size-4", project.isFeatured && "fill-current")} />
          </IconButton>
          <IconButton label={project.isPublished ? "Yashirish" : "Chop etish"} onClick={() => toggle(project, "isPublished")}>
            {project.isPublished ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
          </IconButton>
          <Link href={`/admin/projects/${project.id}`} aria-label="Tahrirlash" className="hidden size-9 place-items-center rounded-lg text-muted hover:bg-white/5 hover:text-fg sm:grid">
            <Pencil className="size-4" />
          </Link>
          <IconButton label="O'chirish" onClick={() => remove(project)} className="hover:text-red-400">
            <Trash2 className="size-4" />
          </IconButton>
        </div>
      )}
    </Sortable>
  );
}
