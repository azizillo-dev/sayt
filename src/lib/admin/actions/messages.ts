"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db, schema } from "@/db";
import { requireAdmin } from "@/lib/auth/session";
import { type ActionResult, ok, run } from "../result";

export async function setMessageRead(id: string, isRead: boolean): Promise<ActionResult> {
  await requireAdmin();
  return run(async () => {
    await db.update(schema.messages).set({ isRead }).where(eq(schema.messages.id, id));
    revalidatePath("/admin", "layout");
    return ok(undefined);
  });
}

export async function deleteMessage(id: string): Promise<ActionResult> {
  await requireAdmin();
  return run(async () => {
    await db.delete(schema.messages).where(eq(schema.messages.id, id));
    revalidatePath("/admin", "layout");
    return ok(undefined);
  });
}
