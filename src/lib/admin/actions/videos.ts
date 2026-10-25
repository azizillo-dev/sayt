"use server";

import { asc, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/db";
import { requireAdmin } from "@/lib/auth/session";
import { type ActionResult, ok, run, UserError } from "../result";
import { revalidateSite } from "../revalidate";

const itemSchema = z.object({
  id: z.uuid().nullable(),
  title: z.string().trim().min(1, "Nomini kiriting").max(160),
  coverId: z.uuid({ error: "Muqova rasmini yuklang" }),
  videoId: z.uuid({ error: "Videoni yuklang" }),
  isPublished: z.boolean(),
});

export type VideoItemInput = z.input<typeof itemSchema>;

export async function saveVideoItem(input: VideoItemInput): Promise<ActionResult<{ id: string }>> {
  await requireAdmin();
  return run(async () => {
    const data = itemSchema.parse(input);
    const assets = await db.select({ id: schema.media.id, kind: schema.media.kind }).from(schema.media)
      .where(inArray(schema.media.id, [data.coverId, data.videoId]));
    if (assets.find((asset) => asset.id === data.coverId)?.kind !== "image" || assets.find((asset) => asset.id === data.videoId)?.kind !== "video") {
      throw new UserError("Muqova yoki video topilmadi");
    }
    let id = data.id;
    if (id) {
      const updated = await db.update(schema.videoItems).set({ title: data.title, coverId: data.coverId, videoId: data.videoId, isPublished: data.isPublished })
        .where(eq(schema.videoItems.id, id)).returning({ id: schema.videoItems.id });
      if (!updated.length) throw new UserError("Video topilmadi");
    } else {
      const [first] = await db.select({ order: schema.videoItems.sortOrder }).from(schema.videoItems)
        .orderBy(asc(schema.videoItems.sortOrder)).limit(1);
      const [created] = await db.insert(schema.videoItems).values({ title: data.title, coverId: data.coverId, videoId: data.videoId, isPublished: data.isPublished, sortOrder: (first?.order ?? 0) - 1 })
        .returning({ id: schema.videoItems.id });
      id = created!.id;
    }
    revalidateSite();
    return ok({ id });
  });
}

export async function deleteVideoItem(id: string): Promise<ActionResult> {
  await requireAdmin();
  return run(async () => {
    const validId = z.uuid().parse(id);
    await db.delete(schema.videoItems).where(eq(schema.videoItems.id, validId));
    revalidateSite();
    return ok(undefined);
  });
}

export async function reorderVideoItems(ids: string[]): Promise<ActionResult> {
  await requireAdmin();
  return run(async () => {
    const order = z.array(z.uuid()).parse(ids);
    const existing = await db.select({ id: schema.videoItems.id }).from(schema.videoItems);
    if (existing.length !== order.length || new Set(order).size !== order.length || existing.some((item) => !order.includes(item.id))) {
      throw new UserError("Ro'yxat eskirgan, sahifani yangilang");
    }
    await db.transaction(async (tx) => {
      for (const [index, id] of order.entries()) await tx.update(schema.videoItems).set({ sortOrder: index }).where(eq(schema.videoItems.id, id));
    });
    revalidateSite();
    return ok(undefined);
  });
}
