import Link from "next/link";
import { Plus } from "lucide-react";
import { PortfolioCoverEditor } from "@/components/admin/portfolio/PortfolioCoverEditor";
import { PortfolioList } from "@/components/admin/portfolio/PortfolioList";
import { PageHeader, buttonClass } from "@/components/admin/ui";
import { getMediaMap } from "@/lib/media/service";
import { listPortfolioItems } from "@/lib/portfolio/admin";
import { portfolioCategories } from "@/lib/portfolio/categories";
import { getSettings } from "@/lib/settings/service";

export default async function PortfolioAdminPage() {
  const [items, settings] = await Promise.all([listPortfolioItems(), getSettings()]);
  const media = await getMediaMap(Object.values(settings.portfolio.covers));
  return <>
    <PageHeader title="Portfolio" description="To'rtta bo'limdagi ishlar, muqovalar va ochilish turini boshqaring."
      actions={<Link href="/admin/portfolio/new" className={buttonClass("primary")}><Plus className="size-4" /> Ish qo'shish</Link>} />
    <PortfolioCoverEditor initial={Object.fromEntries(portfolioCategories.map((category) => {
      const id = settings.portfolio.covers[category.slug];
      return [category.slug, id ? media[id] ?? null : null];
    })) as Record<(typeof portfolioCategories)[number]["slug"], (typeof media)[string] | null>} />
    <PortfolioList items={items.map((item) => ({ id: item.id, title: item.title, category: item.category, isPublished: item.isPublished, cover: item.cover }))} />
  </>;
}
