import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/ui";
import { getSettings } from "@/lib/settings/service";
import { ThemeEditor } from "./ThemeEditor";

export const metadata: Metadata = { title: "Dizayn" };

export default async function ThemePage() {
  const { theme, brand } = await getSettings();
  return (
    <>
      <PageHeader
        title="Dizayn"
        description="Saytning ranglari, shriftlari va burchaklari. O'ngdagi oynada natijani darhol ko'rasiz."
      />
      <ThemeEditor initial={theme} brand={brand.name} />
    </>
  );
}
