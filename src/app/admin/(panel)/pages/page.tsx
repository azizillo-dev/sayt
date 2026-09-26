import { Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { buttonClass, PageHeader } from "@/components/admin/ui";
import { listCustomPages } from "@/lib/admin/queries";
import { PageList } from "./PageList";

export const metadata: Metadata = { title: "Sahifalar" };

export default async function PagesAdminPage() {
  const pages = await listCustomPages();
  return (
    <>
      <PageHeader
        title="Sahifalar"
        description={"\"Ko'proq\" menyusidagi qo'shimcha bo'limlar: xizmatlar, sertifikatlar, narxlar va h.k."}
        actions={
          <Link href="/admin/pages/new" className={buttonClass("primary")}>
            <Plus className="size-4" /> Yangi sahifa
          </Link>
        }
      />
      <PageList initial={pages} />
    </>
  );
}
