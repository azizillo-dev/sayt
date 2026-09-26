import { z } from "zod";
import { blocksSchema } from "@/lib/blocks/schema";
import { SLUG_PATTERN } from "@/lib/slug";

/** One language of a project / page, as edited in the admin. */
export const docSchema = z.object({
  title: z.string().trim().max(200),
  excerpt: z.string().trim().max(600),
  blocks: blocksSchema,
});

export const docsSchema = z.object({ uz: docSchema, ru: docSchema, en: docSchema });

const slug = z.union([z.literal(""), z.string().regex(SLUG_PATTERN, "Slug faqat lotin harflari, raqam va '-' dan iborat bo'lsin")]);

export const projectInputSchema = z.object({
  id: z.uuid().nullable(),
  slug,
  coverId: z.uuid().nullable(),
  publishedAt: z.iso.date(),
  isPublished: z.boolean(),
  isFeatured: z.boolean(),
  docs: docsSchema,
  retranslate: z.boolean(),
});
export type ProjectInput = z.infer<typeof projectInputSchema>;

export const pageInputSchema = z.object({
  id: z.uuid().nullable(),
  kind: z.enum(["about", "custom"]),
  slug,
  imageId: z.uuid().nullable(),
  isPublished: z.boolean(),
  showInMenu: z.boolean(),
  docs: docsSchema,
  retranslate: z.boolean(),
});
export type PageInput = z.infer<typeof pageInputSchema>;

/** Slugs that would shadow built-in routes. */
export const RESERVED_SLUGS = new Set(["about", "projects", "partners", "admin", "api", "media"]);
