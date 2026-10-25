import "server-only";
import { and, asc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { getMediaMap } from "@/lib/media/service";
import type { MediaAsset } from "@/lib/media/types";
import { storage } from "@/lib/storage";
import type { PortfolioCategory } from "./categories";

export interface PortfolioDisplayItem {
  id: string;
  category: string;
  title: string;
  cover: MediaAsset;
  gallery: MediaAsset[];
  openMode: "gallery" | "pdf";
  pdfUrl: string | null;
}

export async function getPortfolioItems(category?: PortfolioCategory): Promise<PortfolioDisplayItem[]> {
  const rows = await db
    .select()
    .from(schema.portfolioItems)
    .where(category
      ? and(eq(schema.portfolioItems.isPublished, true), eq(schema.portfolioItems.category, category))
      : eq(schema.portfolioItems.isPublished, true))
    .orderBy(asc(schema.portfolioItems.sortOrder), asc(schema.portfolioItems.createdAt));
  const media = await getMediaMap(rows.flatMap((row) => [row.coverId, ...row.galleryIds]));
  return rows.flatMap((row) => {
    const cover = row.coverId ? media[row.coverId] : null;
    if (!cover || cover.kind !== "image") return [];
    const gallery = row.galleryIds.map((id) => media[id]).filter((asset): asset is MediaAsset => Boolean(asset && asset.kind === "image"));
    return [{
      id: row.id,
      category: row.category,
      title: row.title,
      cover,
      gallery: gallery.length ? gallery : [cover],
      openMode: row.openMode === "pdf" ? "pdf" as const : "gallery" as const,
      pdfUrl: row.pdfKey ? storage.publicUrl(row.pdfKey) : null,
    }];
  });
}
