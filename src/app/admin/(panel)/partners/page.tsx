import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/ui";
import { getPartners } from "@/lib/content/queries";
import { getSettings } from "@/lib/settings/service";
import { ClientsSettings } from "./ClientsSettings";
import { PartnersPageSettings } from "./PartnersPageSettings";
import { PartnerManager } from "./PartnerManager";

export const metadata: Metadata = { title: "Hamkorlar" };

export default async function PartnersAdminPage() {
  const [partners, settings] = await Promise.all([getPartners(), getSettings()]);

  return (
    <>
      <PageHeader
        title="Hamkorlar"
        description="Bosh sahifadagi tajriba bloki va barcha hamkorlar sahifasi."
      />
      <div className="grid min-w-0 gap-4 sm:gap-6 xl:grid-cols-[1fr_360px]">
        <PartnerManager initial={partners} homeCount={settings.clients.logoCount} />
        <div className="min-w-0 space-y-4 sm:space-y-6">
          <ClientsSettings initial={settings.clients} />
          <PartnersPageSettings initial={settings.partners} />
        </div>
      </div>
    </>
  );
}
