import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { PortfolioEditor } from "@/components/admin/portfolio/PortfolioEditor";
import { PageHeader } from "@/components/admin/ui";
import { loadPortfolioItem } from "@/lib/portfolio/admin";

type Props = { params: Promise<{ id: string }> };
const UUID = /^[0-9a-f-]{36}$/i;

export default async function PortfolioEditPage({ params }: Props) {
  const { id } = await params;
  if (id !== "new" && !UUID.test(id)) notFound();
  const form = await loadPortfolioItem(id === "new" ? null : id);
  if (!form) notFound();
  return <>
    <Link href="/admin/portfolio" className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-muted hover:text-fg">
      <ArrowLeft className="size-4" /> Portfolio
    </Link>
    <PageHeader title={id === "new" ? "Portfolio ishi qo'shish" : form.initial.title} />
    <PortfolioEditor key={id} initial={form.initial} initialMedia={form.media} />
  </>;
}
