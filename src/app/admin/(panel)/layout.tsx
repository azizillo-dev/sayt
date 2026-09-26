import type { ReactNode } from "react";
import { Sidebar } from "@/components/admin/Sidebar";
import { countUnreadMessages } from "@/lib/admin/queries";
import { requireAdmin } from "@/lib/auth/session";
import { getSettings } from "@/lib/settings/service";

export default async function PanelLayout({ children }: { children: ReactNode }) {
  const admin = await requireAdmin();
  const [settings, unread] = await Promise.all([getSettings(), countUnreadMessages()]);

  return (
    <div className="min-h-dvh">
      <Sidebar brand={settings.brand.name} email={admin.email} unread={unread} />
      <main className="px-3 py-5 sm:px-8 sm:py-10 lg:ml-64">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
