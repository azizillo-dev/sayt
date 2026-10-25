import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { VideoEditor } from "@/components/admin/videos/VideoEditor";
import { PageHeader } from "@/components/admin/ui";
import { loadVideoItem } from "@/lib/videos/queries";

type Props = { params: Promise<{ id: string }> };
const UUID = /^[0-9a-f-]{36}$/i;

export default async function VideoEditPage({ params }: Props) {
  const { id } = await params;
  if (id !== "new" && !UUID.test(id)) notFound();
  const form = await loadVideoItem(id === "new" ? null : id);
  if (!form) notFound();
  return <>
    <Link href="/admin/videos" className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-muted hover:text-fg"><ArrowLeft className="size-4" /> Videolar</Link>
    <PageHeader title={id === "new" ? "Video qo'shish" : form.initial.title} />
    <VideoEditor key={id} initial={form.initial} initialMedia={form.media} />
  </>;
}
