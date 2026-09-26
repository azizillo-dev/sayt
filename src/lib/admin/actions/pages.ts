"use server";

import { and, eq, ne } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireAdmin } from "@/lib/auth/session";
import { autoTranslateDocs, type LocalizedDocs } from "@/lib/content/localize";
import { locales } from "@/lib/i18n/config";
import { slugify } from "@/lib/slug";
import { pageInputSchema, RESERVED_SLUGS, type PageInput } from "../documents";
import { type ActionResult, ok, run, UserError } from "../result";
import { revalidateSite } from "../revalidate";
import { translationWarning } from "./shared";

async function assertSlugFree(slug: string, excludeId: string | null) {
  if (RESERVED_SLUGS.has(slug)) throw new UserError(`"${slug}" manzili band — boshqasini tanlang`);
  const clash = await db.query.pages.findFirst({
    where: excludeId ? and(eq(schema.pages.slug, slug), ne(schema.pages.id, excludeId)) : eq(schema.pages.slug, slug),
    columns: { id: true },
  });
  if (clash) throw new UserError(`"${slug}" manzilli sahifa allaqachon bor`);
}

export async function savePage(input: PageInput): Promise<ActionResult<{ id: string; slug: string; docs: LocalizedDocs }>> {
  await requireAdmin();
  return run(async () => {
    const data = pageInputSchema.parse(input);
    if (!data.docs.uz.title) throw new UserError("O'zbekcha sarlavhani kiriting");

    // The About page always lives at /about.
    const slug = data.kind === "about" ? "about" : data.slug || slugify(data.docs.uz.title);
    if (!slug) throw new UserError("Sahifa manzilini (slug) kiriting");
    if (data.kind === "custom") await assertSlugFree(slug, data.id);

    const { docs, failed } = await autoTranslateDocs(data.docs, data.retranslate);
    const fields = {
      slug,
      kind: data.kind,
      imageId: data.imageId,
      isPublished: data.isPublished,
      showInMenu: data.kind === "custom" && data.showInMenu,
    };

    const id = await db.transaction(async (tx) => {
      let pageId = data.id;
      if (pageId) {
        const updated = await tx.update(schema.pages).set(fields).where(eq(schema.pages.id, pageId)).returning({ id: schema.pages.id });
        if (!updated.length) throw new UserError("Sahifa topilmadi");
      } else {
        const count = await tx.$count(schema.pages);
        const [created] = await tx.insert(schema.pages).values({ ...fields, sortOrder: count }).returning({ id: schema.pages.id });
        pageId = created!.id;
      }

      for (const locale of locales) {
        const doc = docs[locale];
        await tx
          .insert(schema.pageTranslations)
          .values({ pageId, locale, ...doc })
          .onConflictDoUpdate({ target: [schema.pageTranslations.pageId, schema.pageTranslations.locale], set: doc });
      }
      return pageId;
    });

    revalidateSite();
    return ok({ id, slug, docs }, translationWarning(failed));
  });
}

export async function deletePage(id: string): Promise<ActionResult> {
  await requireAdmin();
  return run(async () => {
    const page = await db.query.pages.findFirst({ where: eq(schema.pages.id, id), columns: { kind: true } });
    if (page?.kind === "about") throw new UserError("About sahifasini o'chirib bo'lmaydi — uni yashirish mumkin");
    await db.delete(schema.pages).where(eq(schema.pages.id, id));
    revalidateSite();
    return ok(undefined);
  });
}

export async function setPageFlags(
  id: string,
  flags: Partial<{ isPublished: boolean; showInMenu: boolean }>,
): Promise<ActionResult> {
  await requireAdmin();
  return run(async () => {
    await db.update(schema.pages).set(flags).where(eq(schema.pages.id, id));
    revalidateSite();
    return ok(undefined);
  });
}

export async function reorderPages(ids: string[]): Promise<ActionResult> {
  await requireAdmin();
  return run(async () => {
    await db.transaction((tx) =>
      Promise.all(ids.map((id, index) => tx.update(schema.pages).set({ sortOrder: index }).where(eq(schema.pages.id, id)))),
    );
    revalidateSite();
    return ok(undefined);
  });
}
