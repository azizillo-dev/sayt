import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/ui";
import { getPartners } from "@/lib/content/queries";
import { getSettings } from "@/lib/settings/service";
import { MarqueeSettings } from "./MarqueeSettings";
import { PartnerManager } from "./PartnerManager";

export const metadata: Metadata = { title: "Hamkorlar" };

export default async function PartnersAdminPage() {
  const [partners, settings] = await Promise.all([getPartners(), getSettings()]);

  return (
    <>
      <PageHeader
        title="Hamkorlar"
        description="Bosh sahifadagi aylanib turuvchi logotiplar va “Hammasini ko'rish” sahifasi."
      />
      <div className="grid min-w-0 gap-4 sm:gap-6 xl:grid-cols-[1fr_360px]">
        <PartnerManager initial={partners} marqueeCount={settings.partners.marqueeCount} />
        <MarqueeSettings initial={settings.partners} />
      </div>
    </>
  );
}
