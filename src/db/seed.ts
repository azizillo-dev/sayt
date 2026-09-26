/**
 * Idempotent first-run setup: admin account, default settings and an empty
 * About page. Safe to run again — existing rows are left untouched.
 *
 *   npm run db:seed
 */
import bcrypt from "bcryptjs";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { settingsSchema } from "../lib/settings/schema";
import * as schema from "./schema";

async function main() {
  const { DATABASE_URL, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
  if (!DATABASE_URL) throw new Error("DATABASE_URL is not set");

  const client = postgres(DATABASE_URL, { max: 1 });
  const db = drizzle(client, { schema });

  try {
    if (ADMIN_EMAIL && ADMIN_PASSWORD) {
      if (ADMIN_PASSWORD.length < 8) throw new Error("ADMIN_PASSWORD must be at least 8 characters");
      const inserted = await db
        .insert(schema.admins)
        .values({ email: ADMIN_EMAIL.toLowerCase(), passwordHash: await bcrypt.hash(ADMIN_PASSWORD, 12) })
        .onConflictDoNothing()
        .returning({ email: schema.admins.email });
      console.log(inserted.length ? `✓ Admin created: ${ADMIN_EMAIL}` : `• Admin already exists: ${ADMIN_EMAIL}`);
    } else {
      console.warn("! ADMIN_EMAIL / ADMIN_PASSWORD not set — skipping admin account");
    }

    await db.insert(schema.settings).values({ id: 1, data: settingsSchema.parse({}) }).onConflictDoNothing();
    console.log("✓ Settings ready");

    const about = await db.query.pages.findFirst({ where: (p, { eq }) => eq(p.kind, "about") });
    if (!about) {
      const [page] = await db
        .insert(schema.pages)
        .values({ kind: "about", slug: "about", showInMenu: false })
        .returning({ id: schema.pages.id });
      await db.insert(schema.pageTranslations).values([
        { pageId: page!.id, locale: "uz", title: "Men haqimda" },
        { pageId: page!.id, locale: "ru", title: "Обо мне" },
        { pageId: page!.id, locale: "en", title: "About me" },
      ]);
      console.log("✓ About page created");
    }
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
