import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProjectEditor } from "@/components/admin/editor/ProjectEditor";
import { PageHeader } from "@/components/admin/ui";
import { loadProjectForm } from "@/lib/admin/queries";

type Props = { params: Promise<{ id: string }> };

const UUID = /^[0-9a-f-]{36}$/i;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: (await params).id === "new" ? "Yangi loyiha" : "Loyihani tahrirlash" };
}

export default async function ProjectEditPage({ params }: Props) {
  const { id } = await params;
  const isNew = id === "new";
  if (!isNew && !UUID.test(id)) notFound();

  const form = await loadProjectForm(isNew ? null : id);
  if (!form) notFound();

  return (
    <>
      <Link href="/admin/projects" className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-muted hover:text-fg">
        <ArrowLeft className="size-4" /> Loyihalar
      </Link>
      <PageHeader title={isNew ? "Yangi loyiha" : form.initial.docs.uz.title || "Loyiha"} />
      {/* Keyed so navigating between projects remounts with fresh state. */}
      <ProjectEditor key={form.initial.id ?? "new"} initial={form.initial} media={form.media} />
    </>
  );
}
