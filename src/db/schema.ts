import { sql } from "drizzle-orm";
import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import type { Block } from "@/lib/blocks/schema";
import type { MediaVariant } from "@/lib/media/types";

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};

export const localeEnum = pgEnum("locale", ["uz", "ru", "en"]);
export const mediaKindEnum = pgEnum("media_kind", ["image", "video"]);
export const pageKindEnum = pgEnum("page_kind", ["about", "custom"]);

// ── Admin ────────────────────────────────────────────────────

export const admins = pgTable("admins", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  /** Bumped on password change to invalidate every existing session. */
  sessionVersion: integer("session_version").notNull().default(1),
  ...timestamps,
});

// ── Settings (single JSON document, validated by settingsSchema) ──

export const settings = pgTable("settings", {
  id: integer("id").primaryKey().default(1),
  data: jsonb("data").notNull().default(sql`'{}'::jsonb`),
  updatedAt: timestamps.updatedAt,
});

// ── Media ────────────────────────────────────────────────────

export const media = pgTable("media", {
  id: uuid("id").primaryKey().defaultRandom(),
  kind: mediaKindEnum("kind").notNull(),
  /** Storage key of the untouched upload. */
  originalKey: text("original_key").notNull(),
  mimeType: text("mime_type").notNull(),
  fileName: text("file_name").notNull(),
  sizeBytes: integer("size_bytes").notNull(),
  width: integer("width").notNull(),
  height: integer("height").notNull(),
  /** Pre-rendered responsive versions (images only). */
  variants: jsonb("variants").$type<MediaVariant[]>().notNull().default([]),
  /** Tiny base64 image shown while the real one loads. */
  placeholder: text("placeholder"),
  dominantColor: text("dominant_color"),
  alt: text("alt").notNull().default(""),
  createdAt: timestamps.createdAt,
});

// ── Projects ─────────────────────────────────────────────────

export const projects = pgTable(
  "projects",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull(),
    coverId: uuid("cover_id").references(() => media.id, { onDelete: "set null" }),
    publishedAt: date("published_at", { mode: "string" }).notNull().default(sql`CURRENT_DATE`),
    isPublished: boolean("is_published").notNull().default(true),
    isFeatured: boolean("is_featured").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    ...timestamps,
  },
  (t) => [uniqueIndex("projects_slug_idx").on(t.slug), index("projects_order_idx").on(t.sortOrder)],
);

export const projectTranslations = pgTable(
  "project_translations",
  {
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    locale: localeEnum("locale").notNull(),
    title: text("title").notNull().default(""),
    excerpt: text("excerpt").notNull().default(""),
    blocks: jsonb("blocks").$type<Block[]>().notNull().default([]),
  },
  (t) => [primaryKey({ columns: [t.projectId, t.locale] })],
);

// ── Pages (About + custom "More" menu pages) ─────────────────

export const pages = pgTable(
  "pages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    kind: pageKindEnum("kind").notNull().default("custom"),
    slug: text("slug").notNull(),
    /** Round portrait on the About page. */
    imageId: uuid("image_id").references(() => media.id, { onDelete: "set null" }),
    isPublished: boolean("is_published").notNull().default(true),
    showInMenu: boolean("show_in_menu").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    ...timestamps,
  },
  (t) => [uniqueIndex("pages_slug_idx").on(t.slug)],
);

export const pageTranslations = pgTable(
  "page_translations",
  {
    pageId: uuid("page_id")
      .notNull()
      .references(() => pages.id, { onDelete: "cascade" }),
    locale: localeEnum("locale").notNull(),
    title: text("title").notNull().default(""),
    excerpt: text("excerpt").notNull().default(""),
    blocks: jsonb("blocks").$type<Block[]>().notNull().default([]),
  },
  (t) => [primaryKey({ columns: [t.pageId, t.locale] })],
);

// ── Partners ─────────────────────────────────────────────────

export const partners = pgTable("partners", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  logoId: uuid("logo_id").references(() => media.id, { onDelete: "set null" }),
  /** Only used on the "all partners" page — marquee logos are not links. */
  url: text("url"),
  showInMarquee: boolean("show_in_marquee").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  ...timestamps,
});

// ── Social links (footer) ────────────────────────────────────

export const socialLinks = pgTable("social_links", {
  id: uuid("id").primaryKey().defaultRandom(),
  /** Key of a built-in icon, or "custom" to use `iconId`. */
  platform: text("platform").notNull(),
  label: text("label").notNull().default(""),
  url: text("url").notNull(),
  iconId: uuid("icon_id").references(() => media.id, { onDelete: "set null" }),
  sortOrder: integer("sort_order").notNull().default(0),
  ...timestamps,
});

// ── Contact messages ─────────────────────────────────────────

export const messages = pgTable(
  "messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    contact: text("contact").notNull(),
    body: text("body").notNull(),
    locale: localeEnum("locale").notNull(),
    isRead: boolean("is_read").notNull().default(false),
    ip: text("ip"),
    createdAt: timestamps.createdAt,
  },
  (t) => [index("messages_created_idx").on(t.createdAt)],
);

export type Media = typeof media.$inferSelect;
export type Project = typeof projects.$inferSelect;
export type Page = typeof pages.$inferSelect;
export type Partner = typeof partners.$inferSelect;
export type SocialLink = typeof socialLinks.$inferSelect;
export type Message = typeof messages.$inferSelect;
