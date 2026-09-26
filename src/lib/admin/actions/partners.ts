"use server";

import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/db";
import { requireAdmin } from "@/lib/auth/session";
import { type ActionResult, ok, run } from "../result";
import { revalidateSite } from "../revalidate";

const partnerSchema = z.object({
  id: z.uuid().nullable(),
  name: z.string().trim().min(1, "Nomini kiriting").max(120),
  logoId: z.uuid().nullable(),
  url: z.union([z.literal(""), z.url("Havola https:// bilan boshlansin")]),
  showInMarquee: z.boolean(),
});
export type PartnerInput = z.infer<typeof partnerSchema>;

export async function savePartner(input: PartnerInput): Promise<ActionResult<{ id: string }>> {
  await requireAdmin();
  return run(async () => {
    const { id, url, ...rest } = partnerSchema.parse(input);
    const values = { ...rest, url: url || null };

    let savedId = id;
    if (id) {
      await db.update(schema.partners).set(values).where(eq(schema.partners.id, id));
    } else {
      const count = await db.$count(schema.partners);
      const [created] = await db
        .insert(schema.partners)
        .values({ ...values, sortOrder: count })
        .returning({ id: schema.partners.id });
      savedId = created!.id;
    }
    revalidateSite();
    return ok({ id: savedId! });
  });
}

export async function deletePartner(id: string): Promise<ActionResult> {
  await requireAdmin();
  return run(async () => {
    await db.delete(schema.partners).where(eq(schema.partners.id, id));
    revalidateSite();
    return ok(undefined);
  });
}

export async function reorderPartners(ids: string[]): Promise<ActionResult> {
  await requireAdmin();
  return run(async () => {
    await db.transaction((tx) =>
      Promise.all(
        ids.map((id, index) => tx.update(schema.partners).set({ sortOrder: index }).where(eq(schema.partners.id, id))),
      ),
    );
    revalidateSite();
    return ok(undefined);
  });
}
