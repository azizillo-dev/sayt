import type { Metadata } from "next";
import { PageEditor, type PageFormValue } from "@/components/admin/editor/PageEditor";
import { PageHeader } from "@/components/admin/ui";
import { loadPageForm } from "@/lib/admin/queries";

export const metadata: Metadata = { title: "About" };

export default async function AboutAdminPage() {
  // Normally created by the seed; if missing, the first save creates it.
  const form = (await loadPageForm({ kind: "about" })) ?? {
    initial: {
      ...(await loadPageForm(null))!.initial,
      kind: "about",
      slug: "about",
      showInMenu: false,
    } satisfies PageFormValue,
    media: {},
  };

  return (
    <>
      <PageHeader
        title="About — men haqimda"
        description="Profil rasmi, qisqa tanishtiruv va istalgan tartibdagi bloklar: matn, rasmlar, galereya, video…"
      />
      <PageEditor initial={form.initial} media={form.media} />
    </>
  );
}
