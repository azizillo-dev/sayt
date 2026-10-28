"use server";

import { and, asc, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/db";
import { requireAdmin } from "@/lib/auth/session";
import { getPortfolioCategory, portfolioCategories } from "@/lib/portfolio/categories";
import { getSettings, saveSettings } from "@/lib/settings/service";
import { type ActionResult, ok, run, UserError } from "../result";
import { revalidateSite } from "../revalidate";

const itemSchema = z.object({
  id: z.uuid().nullable(),
  category: z.string().refine((value) => Boolean(getPortfolioCategory(value)), "Bo'limni tanlang"),
  title: z.string().trim().min(1, "Nomini kiriting").max(160),
  coverId: z.uuid({ error: "Muqova rasmini yuklang" }),
  galleryIds: z.array(z.uuid()).max(80),
  openMode: z.enum(["gallery", "pdf"]),
  pdfKey: z.string().regex(/^uploads\/[0-9a-f-]{36}\/original\.pdf$/).nullable(),
  pdfName: z.string().max(200).nullable(),
  isPublished: z.boolean(),
}).superRefine((item, ctx) => {
  if (item.openMode === "pdf" && !item.pdfKey) ctx.addIssue({ code: "custom", path: ["pdfKey"], message: "PDF faylni yuklang" });
});

export type PortfolioItemInput = z.input<typeof itemSchema>;

const coversSchema = z.object({
  "logo-branding": z.uuid().nullable(),
  "social-media": z.uuid().nullable(),
  "advertising-design": z.uuid().nullable(),
  "visual-design": z.uuid().nullable(),
});

export async function savePortfolioCovers(input: z.input<typeof coversSchema>): Promise<ActionResult> {
  await requireAdmin();
  return run(async () => {
    const covers = coversSchema.parse(input);
    const ids = [...new Set(portfolioCategories.map((category) => covers[category.slug]).filter((id): id is string => Boolean(id)))];
    if (ids.length) {
      const assets = await db.select({ id: schema.media.id, kind: schema.media.kind }).from(schema.media).where(inArray(schema.media.id, ids));
      if (assets.length !== ids.length || assets.some((asset) => asset.kind !== "image")) throw new UserError("Rasmlardan biri topilmadi");
    }
    const current = await getSettings();
    await saveSettings({ ...current, portfolio: { ...current.portfolio, covers } });
    revalidateSite();
    return ok(undefined);
  });
}

export async function savePortfolioItem(input: PortfolioItemInput): Promise<ActionResult<{ id: string }>> {
  await requireAdmin();
  return run(async () => {
    const data = itemSchema.parse(input);
    // The gallery is optional: a work without one shows its cover alone.
    const ids = [...new Set([data.coverId, ...data.galleryIds])];
    const media = await db.select({ id: schema.media.id, kind: schema.media.kind }).from(schema.media).where(inArray(schema.media.id, ids));
    if (media.length !== ids.length || media.some((item) => item.kind !== "image")) throw new UserError("Rasmlardan biri topilmadi");
    const fields = {
      category: data.category,
      title: data.title,
      coverId: data.coverId,
      galleryIds: data.galleryIds,
      openMode: data.openMode,
      pdfKey: data.pdfKey,
      pdfName: data.pdfName,
      isPublished: data.isPublished,
    };
    let id = data.id;
    if (id) {
      const updated = await db.update(schema.portfolioItems).set(fields).where(eq(schema.portfolioItems.id, id)).returning({ id: schema.portfolioItems.id });
      if (!updated.length) throw new UserError("Portfolio ishi topilmadi");
    } else {
      const [first] = await db.select({ order: schema.portfolioItems.sortOrder }).from(schema.portfolioItems)
        .where(eq(schema.portfolioItems.category, data.category)).orderBy(asc(schema.portfolioItems.sortOrder)).limit(1);
      const [created] = await db.insert(schema.portfolioItems).values({ ...fields, sortOrder: (first?.order ?? 0) - 1 }).returning({ id: schema.portfolioItems.id });
      id = created!.id;
    }
    revalidateSite();
    return ok({ id });
  });
}

export async function deletePortfolioItem(id: string): Promise<ActionResult> {
  await requireAdmin();
  return run(async () => {
    await db.delete(schema.portfolioItems).where(eq(schema.portfolioItems.id, id));
    revalidateSite();
    return ok(undefined);
  });
}

export async function reorderPortfolioItems(category: string, ids: string[]): Promise<ActionResult> {
  await requireAdmin();
  return run(async () => {
    if (!getPortfolioCategory(category)) throw new UserError("Bo'lim noto'g'ri");
    const existing = await db.select({ id: schema.portfolioItems.id }).from(schema.portfolioItems)
      .where(and(eq(schema.portfolioItems.category, category), inArray(schema.portfolioItems.id, ids)));
    if (existing.length !== ids.length) throw new UserError("Ro'yxat eskirgan, sahifani yangilang");
    await db.transaction(async (tx) => {
      for (const [index, id] of ids.entries()) {
        await tx.update(schema.portfolioItems).set({ sortOrder: index }).where(eq(schema.portfolioItems.id, id));
      }
    });
    revalidateSite();
    return ok(undefined);
  });
}
