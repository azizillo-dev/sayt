import { ArrowRight, FolderKanban, Handshake, Mail, Plus } from "lucide-react";
import Link from "next/link";
import { buttonClass, Card, PageHeader } from "@/components/admin/ui";
import { dashboardStats, listMessages } from "@/lib/admin/queries";
import { formatDate } from "@/lib/i18n/format";

export default async function DashboardPage() {
  const [stats, messages] = await Promise.all([dashboardStats(), listMessages()]);
  const latest = messages.slice(0, 5);

  const tiles = [
    { label: "Loyihalar", value: stats.projects, sub: `${stats.published} chop etilgan`, href: "/admin/projects", icon: FolderKanban },
    { label: "Hamkorlar", value: stats.partners, sub: "logotip", href: "/admin/partners", icon: Handshake },
    { label: "Yangi xabarlar", value: stats.unread, sub: "o'qilmagan", href: "/admin/messages", icon: Mail },
  ];

  return (
    <>
      <PageHeader
        title="Xush kelibsiz 👋"
        description="Saytingizdagi hamma narsani shu yerdan boshqarasiz."
        actions={
          <Link href="/admin/projects/new" className={buttonClass("primary")}>
            <Plus className="size-4" /> Yangi loyiha
          </Link>
        }
      />

      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        {tiles.map(({ label, value, sub, href, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="rounded-xl border border-border bg-surface p-3 transition-colors hover:border-accent/50 sm:rounded-2xl sm:p-6"
          >
            <div className="flex items-center justify-between gap-1 text-muted">
              <span className="truncate text-[11px] font-medium sm:text-sm">{label}</span>
              <Icon className="size-4 shrink-0 sm:size-5" />
            </div>
            <p className="mt-1.5 text-2xl font-bold tabular-nums sm:mt-4 sm:text-4xl">{value}</p>
            <p className="truncate text-[11px] text-muted sm:mt-1 sm:text-sm">{sub}</p>
          </Link>
        ))}
      </div>

      <Card
        className="mt-6"
        title="So'nggi xabarlar"
        actions={
          <Link href="/admin/messages" className="inline-flex items-center gap-1 text-sm font-semibold text-accent">
            Hammasi <ArrowRight className="size-4" />
          </Link>
        }
      >
        {latest.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted">Hozircha xabar yo&apos;q. Bog&apos;lanish formasi orqali kelgan xabarlar shu yerda chiqadi.</p>
        ) : (
          <ul className="divide-y divide-border">
            {latest.map((m) => (
              <li key={m.id} className="flex items-start gap-4 py-4">
                <span className={`mt-2 size-2 shrink-0 rounded-full ${m.isRead ? "bg-transparent" : "bg-accent"}`} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="font-semibold">{m.name}</p>
                    <time className="text-xs text-muted">{formatDate(m.createdAt, "uz")}</time>
                  </div>
                  <p className="text-sm text-muted">{m.contact}</p>
                  <p className="mt-1 line-clamp-2 text-sm">{m.body}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
