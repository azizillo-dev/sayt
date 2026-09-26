"use server";

import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/db";
import { requireAdmin } from "@/lib/auth/session";
import { platformOptions } from "@/lib/social/platforms";
import { type ActionResult, ok, run, UserError } from "../result";
import { revalidateSite } from "../revalidate";

const platformKeys = platformOptions.map((p) => p.key) as [string, ...string[]];

const socialSchema = z.object({
  id: z.uuid().nullable(),
  platform: z.enum(platformKeys),
  label: z.string().trim().max(60),
  url: z.string().trim().min(3, "Havola yoki qiymatni kiriting").max(300),
  iconId: z.uuid().nullable(),
});
export type SocialInput = z.infer<typeof socialSchema>;

export async function saveSocialLink(input: SocialInput): Promise<ActionResult<{ id: string }>> {
  await requireAdmin();
  return run(async () => {
    const { id, ...values } = socialSchema.parse(input);
    if (values.platform === "custom" && !values.iconId) throw new UserError("Boshqa tarmoq uchun ikonka yuklang");

    let savedId = id;
    if (id) {
      await db.update(schema.socialLinks).set(values).where(eq(schema.socialLinks.id, id));
    } else {
      const count = await db.$count(schema.socialLinks);
      const [created] = await db
        .insert(schema.socialLinks)
        .values({ ...values, sortOrder: count })
        .returning({ id: schema.socialLinks.id });
      savedId = created!.id;
    }
    revalidateSite();
    return ok({ id: savedId! });
  });
}

export async function deleteSocialLink(id: string): Promise<ActionResult> {
  await requireAdmin();
  return run(async () => {
    await db.delete(schema.socialLinks).where(eq(schema.socialLinks.id, id));
    revalidateSite();
    return ok(undefined);
  });
}

export async function reorderSocialLinks(ids: string[]): Promise<ActionResult> {
  await requireAdmin();
  return run(async () => {
    await db.transaction((tx) =>
      Promise.all(
        ids.map((id, index) => tx.update(schema.socialLinks).set({ sortOrder: index }).where(eq(schema.socialLinks.id, id))),
      ),
    );
    revalidateSite();
    return ok(undefined);
  });
}
