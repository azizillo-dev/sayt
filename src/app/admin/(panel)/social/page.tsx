import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/ui";
import { getSocialLinks } from "@/lib/content/queries";
import { SocialManager } from "./SocialManager";

export const metadata: Metadata = { title: "Ijtimoiy tarmoqlar" };

export default async function SocialAdminPage() {
  const links = await getSocialLinks();
  return (
    <>
      <PageHeader title="Ijtimoiy tarmoqlar" description="Saytning eng pastidagi “Meni kuzating” bo'limi. Tartibni surib o'zgartiring." />
      <SocialManager initial={links} />
    </>
  );
}
