"use client";

import {
  ExternalLink,
  FileText,
  FolderKanban,
  Handshake,
  LayoutDashboard,
  LogOut,
  Mail,
  Menu,
  Paintbrush,
  Settings,
  Share2,
  User,
  X,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { logout } from "@/lib/admin/actions/auth";
import { cn } from "@/lib/cn";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
  badge?: boolean;
}

const nav: NavItem[] = [
  { href: "/admin", label: "Boshqaruv", icon: LayoutDashboard, exact: true },
  { href: "/admin/projects", label: "Loyihalar", icon: FolderKanban },
  { href: "/admin/partners", label: "Hamkorlar", icon: Handshake },
  { href: "/admin/about", label: "About", icon: User },
  { href: "/admin/pages", label: "Sahifalar", icon: FileText },
  { href: "/admin/social", label: "Ijtimoiy tarmoqlar", icon: Share2 },
  { href: "/admin/messages", label: "Xabarlar", icon: Mail, badge: true },
  { href: "/admin/theme", label: "Dizayn", icon: Paintbrush },
  { href: "/admin/settings", label: "Sozlamalar", icon: Settings },
];

function Badge({ count }: { count: number }) {
  return <span className="rounded-full bg-accent px-1.5 py-0.5 text-[11px] font-bold leading-none text-accent-fg">{count}</span>;
}

/** Fixed sidebar on desktop; on phones a slim bar with a slide-in menu. */
export function Sidebar({ brand, email, unread }: { brand: string; email: string; unread: number }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const isActive = (item: NavItem) => (item.exact ? pathname === item.href : pathname.startsWith(item.href));
  const current = nav.find(isActive);

  // Close the drawer after navigating.
  useEffect(() => setOpen(false), [pathname]);

  return (
    <>
      {/* ── Mobile: slim bar + slide-in menu ───────────────── */}
      <div className="sticky top-0 z-40 flex h-12 items-center justify-between gap-2 border-b border-border bg-bg/90 px-3 backdrop-blur-xl lg:hidden">
        <button type="button" onClick={() => setOpen(true)} aria-label="Menyu" className="-ml-1 grid size-9 shrink-0 place-items-center rounded-lg hover:bg-white/5">
          <Menu className="size-5" />
        </button>
        <span className="min-w-0 flex-1 truncate text-center text-sm font-semibold">{current?.label ?? brand}</span>
        <span className="flex w-9 justify-end">{unread > 0 && !current?.badge && <Badge count={unread} />}</span>
      </div>

      <div className={cn("fixed inset-0 z-50 lg:hidden", !open && "pointer-events-none")}>
        <div
          onClick={() => setOpen(false)}
          className={cn("absolute inset-0 bg-black/60 transition-opacity duration-300", open ? "opacity-100" : "opacity-0")}
        />
        <aside
          className={cn(
            "absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col border-r border-border bg-surface transition-transform duration-300 ease-out-expo",
            open ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <div className="flex items-start justify-between px-5 pb-5 pt-5">
            <div className="min-w-0">
              <p className="truncate text-lg font-bold tracking-tight">{brand}</p>
              <p className="mt-0.5 truncate text-xs text-muted">{email}</p>
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label="Yopish" className="-mr-2 grid size-9 shrink-0 place-items-center rounded-lg text-muted hover:bg-white/5">
              <X className="size-5" />
            </button>
          </div>
          <nav className="flex-1 space-y-0.5 overflow-y-auto px-3">
            {nav.map((item) => (
              <Link key={item.href} href={item.href} className={itemClass(isActive(item))}>
                <item.icon className="size-[18px]" />
                {item.label}
                {item.badge && unread > 0 && (
                  <span className="ml-auto">
                    <Badge count={unread} />
                  </span>
                )}
              </Link>
            ))}
          </nav>
          <Footer />
        </aside>
      </div>

      {/* ── Desktop ────────────────────────────────────────── */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-border bg-surface lg:flex">
        <div className="px-5 pb-6 pt-6">
          <p className="text-lg font-bold tracking-tight">{brand}</p>
          <p className="mt-0.5 truncate text-xs text-muted">{email}</p>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto px-3">
          {nav.map((item) => (
            <Link key={item.href} href={item.href} className={itemClass(isActive(item))}>
              <item.icon className="size-[18px]" />
              {item.label}
              {item.badge && unread > 0 && (
                <span className="ml-auto">
                  <Badge count={unread} />
                </span>
              )}
            </Link>
          ))}
        </nav>

        <Footer />
      </aside>
    </>
  );
}

function itemClass(active: boolean) {
  return cn(
    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-medium transition-colors",
    active ? "bg-white/[0.07] text-fg" : "text-muted hover:bg-white/[0.04] hover:text-fg",
  );
}

/** "Open site" + "Log out", shared by the drawer and the desktop sidebar. */
function Footer() {
  return (
    <div className="space-y-0.5 border-t border-border p-3">
      <a href="/" target="_blank" rel="noreferrer" className={itemClass(false)}>
        <ExternalLink className="size-[18px]" />
        Saytni ochish
      </a>
      <form action={logout}>
        <button
          type="submit"
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-medium text-muted transition-colors hover:bg-red-500/10 hover:text-red-400"
        >
          <LogOut className="size-[18px]" />
          Chiqish
        </button>
      </form>
    </div>
  );
}
