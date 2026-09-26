import "server-only";
import { cache } from "react";
import { db, schema } from "@/db";
import { settingsSchema, type SiteSettings } from "./schema";

/**
 * Settings are parsed through the schema on every read, so documents saved by
 * an older version of the app are transparently filled with new defaults.
 */
export const getSettings = cache(async (): Promise<SiteSettings> => {
  const row = await db.query.settings.findFirst();
  const parsed = settingsSchema.safeParse(row?.data ?? {});
  return parsed.success ? parsed.data : settingsSchema.parse({});
});

export async function saveSettings(data: SiteSettings) {
  const value = settingsSchema.parse(data);
  await db
    .insert(schema.settings)
    .values({ id: 1, data: value })
    .onConflictDoUpdate({ target: schema.settings.id, set: { data: value } });
}
