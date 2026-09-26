import { Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { buttonClass, PageHeader } from "@/components/admin/ui";
import { listProjects } from "@/lib/admin/queries";
import { getSettings } from "@/lib/settings/service";
import { ProjectList } from "./ProjectList";

export const metadata: Metadata = { title: "Loyihalar" };

export default async function ProjectsAdminPage() {
  const [projects, settings] = await Promise.all([listProjects(), getSettings()]);
  const { showAllOnHome, featuredLimit } = settings.projects;

  return (
    <>
      <PageHeader
        title="Loyihalar"
        description={
          showAllOnHome
            ? "Barcha chop etilgan loyihalar bosh sahifada chiqadi (Sozlamalarda o'zgartiriladi)."
            : `Bosh sahifada "tanlangan" belgili dastlabki ${featuredLimit} ta loyiha chiqadi. Tartibni surib o'zgartiring.`
        }
        actions={
          <Link href="/admin/projects/new" className={buttonClass("primary")}>
            <Plus className="size-4" /> Yangi loyiha
          </Link>
        }
      />
      <ProjectList initial={projects} />
    </>
  );
}
