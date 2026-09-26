"use server";

import { and, eq, inArray, ne } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireAdmin } from "@/lib/auth/session";
import { autoTranslateDocs, type LocalizedDocs } from "@/lib/content/localize";
import { locales } from "@/lib/i18n/config";
import { slugify } from "@/lib/slug";
import { type ActionResult, ok, run, UserError } from "../result";
import { projectInputSchema, type ProjectInput } from "../documents";
import { revalidateSite } from "../revalidate";
import { translationWarning } from "./shared";

async function uniqueSlug(base: string, excludeId: string | null): Promise<string> {
  const root = base || "loyiha";
  for (let n = 1; ; n++) {
    const candidate = n === 1 ? root : `${root}-${n}`;
    const clash = await db.query.projects.findFirst({
      where: excludeId
        ? and(eq(schema.projects.slug, candidate), ne(schema.projects.id, excludeId))
        : eq(schema.projects.slug, candidate),
      columns: { id: true },
    });
    if (!clash) return candidate;
  }
}

export async function saveProject(
  input: ProjectInput,
): Promise<ActionResult<{ id: string; slug: string; docs: LocalizedDocs }>> {
  await requireAdmin();
  return run(async () => {
    const data = projectInputSchema.parse(input);
    if (!data.docs.uz.title) throw new UserError("O'zbekcha sarlavhani kiriting");

    const { docs, failed } = await autoTranslateDocs(data.docs, data.retranslate);
    const slug = await uniqueSlug(data.slug || slugify(data.docs.uz.title), data.id);
    const fields = {
      slug,
      coverId: data.coverId,
      publishedAt: data.publishedAt,
      isPublished: data.isPublished,
      isFeatured: data.isFeatured,
    };

    const id = await db.transaction(async (tx) => {
      let projectId = data.id;
      if (projectId) {
        const updated = await tx
          .update(schema.projects)
          .set(fields)
          .where(eq(schema.projects.id, projectId))
          .returning({ id: schema.projects.id });
        if (!updated.length) throw new UserError("Loyiha topilmadi — u o'chirilgan bo'lishi mumkin");
      } else {
        // New projects go to the top of the list.
        const [first] = await tx
          .select({ order: schema.projects.sortOrder })
          .from(schema.projects)
          .orderBy(schema.projects.sortOrder)
          .limit(1);
        const [created] = await tx
          .insert(schema.projects)
          .values({ ...fields, sortOrder: (first?.order ?? 0) - 1 })
          .returning({ id: schema.projects.id });
        projectId = created!.id;
      }

      for (const locale of locales) {
        const doc = docs[locale];
        await tx
          .insert(schema.projectTranslations)
          .values({ projectId, locale, ...doc })
          .onConflictDoUpdate({
            target: [schema.projectTranslations.projectId, schema.projectTranslations.locale],
            set: doc,
          });
      }
      return projectId;
    });

    revalidateSite();
    return ok({ id, slug, docs }, translationWarning(failed));
  });
}

export async function deleteProject(id: string): Promise<ActionResult> {
  await requireAdmin();
  return run(async () => {
    await db.delete(schema.projects).where(eq(schema.projects.id, id));
    revalidateSite();
    return ok(undefined);
  });
}

export async function setProjectFlags(
  id: string,
  flags: Partial<{ isPublished: boolean; isFeatured: boolean }>,
): Promise<ActionResult> {
  await requireAdmin();
  return run(async () => {
    await db.update(schema.projects).set(flags).where(eq(schema.projects.id, id));
    revalidateSite();
    return ok(undefined);
  });
}

export async function reorderProjects(ids: string[]): Promise<ActionResult> {
  await requireAdmin();
  return run(async () => {
    await db.transaction(async (tx) => {
      const existing = await tx
        .select({ id: schema.projects.id })
        .from(schema.projects)
        .where(inArray(schema.projects.id, ids));
      if (existing.length !== ids.length) throw new UserError("Ro'yxat eskirgan — sahifani yangilang");
      await Promise.all(
        ids.map((id, index) => tx.update(schema.projects).set({ sortOrder: index }).where(eq(schema.projects.id, id))),
      );
    });
    revalidateSite();
    return ok(undefined);
  });
}
