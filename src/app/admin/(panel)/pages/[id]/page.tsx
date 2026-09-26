import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageEditor } from "@/components/admin/editor/PageEditor";
import { PageHeader } from "@/components/admin/ui";
import { loadPageForm } from "@/lib/admin/queries";

type Props = { params: Promise<{ id: string }> };

const UUID = /^[0-9a-f-]{36}$/i;

export const metadata: Metadata = { title: "Sahifa" };

export default async function PageEditPage({ params }: Props) {
  const { id } = await params;
  const isNew = id === "new";
  if (!isNew && !UUID.test(id)) notFound();

  const form = await loadPageForm(isNew ? null : { id });
  if (!form || form.initial.kind === "about") notFound();

  return (
    <>
      <Link href="/admin/pages" className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-muted hover:text-fg">
        <ArrowLeft className="size-4" /> Sahifalar
      </Link>
      <PageHeader title={isNew ? "Yangi sahifa" : form.initial.docs.uz.title || "Sahifa"} />
      <PageEditor key={form.initial.id ?? "new"} initial={form.initial} media={form.media} />
    </>
  );
}
