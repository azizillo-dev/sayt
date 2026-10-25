import Link from "next/link";
import { Plus } from "lucide-react";
import { VideoList } from "@/components/admin/videos/VideoList";
import { PageHeader, buttonClass } from "@/components/admin/ui";
import { listVideoItems } from "@/lib/videos/queries";

export default async function VideosAdminPage() {
  const items = await listVideoItems();
  return <>
    <PageHeader title="Videolar" description="Bosh sahifadagi reels va video galereyasini boshqaring."
      actions={<Link href="/admin/videos/new" className={buttonClass("primary")}><Plus className="size-4" /> Video qo'shish</Link>} />
    <VideoList items={items.map((item) => ({ id: item.id, title: item.title, isPublished: item.isPublished, cover: item.cover }))} />
  </>;
}
