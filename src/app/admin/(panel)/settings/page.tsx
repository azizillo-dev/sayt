import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/ui";
import { getMediaMap } from "@/lib/media/service";
import { getSettings } from "@/lib/settings/service";
import { GeneralSettingsForm } from "./GeneralSettingsForm";
import { PasswordForm } from "./PasswordForm";

export const metadata: Metadata = { title: "Sozlamalar" };

export default async function SettingsPage() {
  const { brand, hero, projects, contact, seo } = await getSettings();
  const smtpConfigured = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD);
  const media = await getMediaMap([hero.photoId]);

  return (
    <>
      <PageHeader title="Sozlamalar" description="Sayt nomi, bosh sahifa matnlari, loyihalar va bog'lanish." />
      <GeneralSettingsForm
        initial={{ brand, hero, projects, contact, seo }}
        heroPhoto={hero.photoId ? (media[hero.photoId] ?? null) : null}
        smtpConfigured={smtpConfigured}
      />
      <div className="mt-10">
        <PasswordForm />
      </div>
    </>
  );
}
