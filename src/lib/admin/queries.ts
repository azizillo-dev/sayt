import "server-only";
import { and, asc, count, desc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import type { PageFormValue } from "@/components/admin/editor/PageEditor";
import type { ProjectFormValue } from "@/components/admin/editor/ProjectEditor";
import { collectMediaIds } from "@/lib/blocks/utils";
import type { LocalizedDocs } from "@/lib/content/localize";
import { locales } from "@/lib/i18n/config";
import { getMediaMap } from "@/lib/media/service";
import type { MediaAsset, MediaMap } from "@/lib/media/types";

const emptyDocs = (): LocalizedDocs => ({
  uz: { title: "", excerpt: "", blocks: [] },
  ru: { title: "", excerpt: "", blocks: [] },
  en: { title: "", excerpt: "", blocks: [] },
});

function toDocs(rows: { locale: (typeof locales)[number]; title: string; excerpt: string; blocks: LocalizedDocs["uz"]["blocks"] }[]) {
  const docs = emptyDocs();
  for (const { locale, title, excerpt, blocks } of rows) docs[locale] = { title, excerpt, blocks };
  return docs;
}

function docsMediaIds(docs: LocalizedDocs): string[] {
  return locales.flatMap((l) => collectMediaIds(docs[l].blocks));
}

const today = () => new Date().toISOString().slice(0, 10);

// ── Projects ─────────────────────────────────────────────────

export async function loadProjectForm(id: string | null): Promise<{ initial: ProjectFormValue; media: MediaMap } | null> {
  if (!id) {
    return {
      initial: { id: null, slug: "", coverId: null, publishedAt: today(), isPublished: true, isFeatured: true, docs: emptyDocs() },
      media: {},
    };
  }
  const project = await db.query.projects.findFirst({ where: eq(schema.projects.id, id) });
  if (!project) return null;
  const rows = await db.select().from(schema.projectTranslations).where(eq(schema.projectTranslations.projectId, id));
  const docs = toDocs(rows);

  return {
    initial: {
      id: project.id,
      slug: project.slug,
      coverId: project.coverId,
      publishedAt: project.publishedAt,
      isPublished: project.isPublished,
      isFeatured: project.isFeatured,
      docs,
    },
    media: await getMediaMap([project.coverId, ...docsMediaIds(docs)]),
  };
}

export interface AdminProjectRow {
  id: string;
  slug: string;
  title: string;
  publishedAt: string;
  isPublished: boolean;
  isFeatured: boolean;
  cover: MediaAsset | null;
}

export async function listProjects(): Promise<AdminProjectRow[]> {
  const rows = await db
    .select({
      id: schema.projects.id,
      slug: schema.projects.slug,
      title: schema.projectTranslations.title,
      publishedAt: schema.projects.publishedAt,
      isPublished: schema.projects.isPublished,
      isFeatured: schema.projects.isFeatured,
      coverId: schema.projects.coverId,
    })
    .from(schema.projects)
    .leftJoin(
      schema.projectTranslations,
      and(eq(schema.projectTranslations.projectId, schema.projects.id), eq(schema.projectTranslations.locale, "uz")),
    )
    .orderBy(asc(schema.projects.sortOrder), desc(schema.projects.publishedAt));

  const media = await getMediaMap(rows.map((r) => r.coverId));
  return rows.map(({ coverId, title, ...r }) => ({
    ...r,
    title: title || r.slug,
    cover: coverId ? (media[coverId] ?? null) : null,
  }));
}

// ── Pages ────────────────────────────────────────────────────

export async function loadPageForm(where: { id: string } | { kind: "about" } | null) {
  if (!where) {
    const initial: PageFormValue = {
      id: null,
      kind: "custom",
      slug: "",
      imageId: null,
      isPublished: true,
      showInMenu: true,
      docs: emptyDocs(),
    };
    return { initial, media: {} as MediaMap };
  }

  const page = await db.query.pages.findFirst({
    where: "id" in where ? eq(schema.pages.id, where.id) : eq(schema.pages.kind, "about"),
  });
  if (!page) return null;
  const rows = await db.select().from(schema.pageTranslations).where(eq(schema.pageTranslations.pageId, page.id));
  const docs = toDocs(rows);

  const initial: PageFormValue = {
    id: page.id,
    kind: page.kind,
    slug: page.slug,
    imageId: page.imageId,
    isPublished: page.isPublished,
    showInMenu: page.showInMenu,
    docs,
  };
  return { initial, media: await getMediaMap([page.imageId, ...docsMediaIds(docs)]) };
}

export interface AdminPageRow {
  id: string;
  slug: string;
  title: string;
  isPublished: boolean;
  showInMenu: boolean;
}

export async function listCustomPages(): Promise<AdminPageRow[]> {
  const rows = await db
    .select({
      id: schema.pages.id,
      slug: schema.pages.slug,
      title: schema.pageTranslations.title,
      isPublished: schema.pages.isPublished,
      showInMenu: schema.pages.showInMenu,
    })
    .from(schema.pages)
    .leftJoin(schema.pageTranslations, and(eq(schema.pageTranslations.pageId, schema.pages.id), eq(schema.pageTranslations.locale, "uz")))
    .where(eq(schema.pages.kind, "custom"))
    .orderBy(asc(schema.pages.sortOrder));
  return rows.map((r) => ({ ...r, title: r.title || r.slug }));
}

// ── Messages & dashboard ─────────────────────────────────────

export function listMessages() {
  return db.select().from(schema.messages).orderBy(desc(schema.messages.createdAt)).limit(500);
}

export async function countUnreadMessages(): Promise<number> {
  const [row] = await db.select({ n: count() }).from(schema.messages).where(eq(schema.messages.isRead, false));
  return row?.n ?? 0;
}

export async function dashboardStats() {
  const [projects, published, partners, pages, unread] = await Promise.all([
    db.$count(schema.projects),
    db.$count(schema.projects, eq(schema.projects.isPublished, true)),
    db.$count(schema.partners),
    db.$count(schema.pages, eq(schema.pages.kind, "custom")),
    countUnreadMessages(),
  ]);
  return { projects, published, partners, pages, unread };
}
