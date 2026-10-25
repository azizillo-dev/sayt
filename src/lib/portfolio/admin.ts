import "server-only";
import { asc, desc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { getMediaMap } from "@/lib/media/service";
import type { MediaMap } from "@/lib/media/types";
import { storage } from "@/lib/storage";

export async function listPortfolioItems() {
  const rows = await db.select().from(schema.portfolioItems)
    .orderBy(asc(schema.portfolioItems.category), asc(schema.portfolioItems.sortOrder), desc(schema.portfolioItems.createdAt));
  const media = await getMediaMap(rows.map((row) => row.coverId));
  return rows.map((row) => ({ ...row, cover: row.coverId ? media[row.coverId] ?? null : null }));
}

export async function loadPortfolioItem(id: string | null): Promise<{ initial: {
  id: string | null;
  category: string;
  title: string;
  coverId: string | null;
  galleryIds: string[];
  openMode: "gallery" | "pdf";
  pdfKey: string | null;
  pdfName: string | null;
  pdfUrl: string | null;
  isPublished: boolean;
}; media: MediaMap } | null> {
  if (!id) return {
    initial: { id: null, category: "logo-branding", title: "", coverId: null, galleryIds: [], openMode: "gallery", pdfKey: null, pdfName: null, pdfUrl: null, isPublished: true },
    media: {},
  };
  const row = await db.query.portfolioItems.findFirst({ where: eq(schema.portfolioItems.id, id) });
  if (!row) return null;
  return {
    initial: {
      id: row.id,
      category: row.category,
      title: row.title,
      coverId: row.coverId,
      galleryIds: row.galleryIds,
      openMode: row.openMode === "pdf" ? "pdf" : "gallery",
      pdfKey: row.pdfKey,
      pdfName: row.pdfName,
      pdfUrl: row.pdfKey ? storage.publicUrl(row.pdfKey) : null,
      isPublished: row.isPublished,
    },
    media: await getMediaMap([row.coverId, ...row.galleryIds]),
  };
}
