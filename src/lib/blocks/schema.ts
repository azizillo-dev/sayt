import { z } from "zod";

/**
 * Content blocks power projects, the About page and custom pages.
 * Every block carries a stable client-generated `id` so drag-and-drop
 * reordering and React keys stay consistent.
 */

const blockId = z.string().min(1).max(64);
const mediaRef = z.uuid().nullable();
const shortText = z.string().max(500);
const longText = z.string().max(20_000);

export const blockSizes = ["normal", "wide", "full"] as const;
const size = z.enum(blockSizes).default("normal");

const textBlock = z.object({ id: blockId, type: z.literal("text"), text: longText });

const headingBlock = z.object({
  id: blockId,
  type: z.literal("heading"),
  level: z.union([z.literal(2), z.literal(3)]).default(2),
  text: shortText,
});

const imageBlock = z.object({
  id: blockId,
  type: z.literal("image"),
  mediaId: mediaRef,
  caption: shortText.default(""),
  size,
});

const galleryBlock = z.object({
  id: blockId,
  type: z.literal("gallery"),
  mediaIds: z.array(z.uuid()).max(60),
  columns: z.union([z.literal(1), z.literal(2), z.literal(3)]).default(2),
  caption: shortText.default(""),
});

const videoBlock = z.object({
  id: blockId,
  type: z.literal("video"),
  mediaId: mediaRef,
  caption: shortText.default(""),
  size,
});

const youtubeBlock = z.object({
  id: blockId,
  type: z.literal("youtube"),
  url: z.string().max(300),
  caption: shortText.default(""),
});

const quoteBlock = z.object({
  id: blockId,
  type: z.literal("quote"),
  text: longText,
  author: shortText.default(""),
});

const dividerBlock = z.object({ id: blockId, type: z.literal("divider") });

const beforeAfterBlock = z.object({
  id: blockId,
  type: z.literal("beforeAfter"),
  beforeId: mediaRef,
  afterId: mediaRef,
  caption: shortText.default(""),
});

const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/);

const paletteBlock = z.object({
  id: blockId,
  type: z.literal("palette"),
  colors: z.array(z.object({ hex: hexColor, name: shortText.default("") })).max(12),
});

const infoBlock = z.object({
  id: blockId,
  type: z.literal("info"),
  items: z.array(z.object({ label: shortText, value: shortText })).max(12),
});

export const blockSchema = z.discriminatedUnion("type", [
  textBlock,
  headingBlock,
  imageBlock,
  galleryBlock,
  videoBlock,
  youtubeBlock,
  quoteBlock,
  dividerBlock,
  beforeAfterBlock,
  paletteBlock,
  infoBlock,
]);

export const blocksSchema = z.array(blockSchema).max(200);

export type Block = z.infer<typeof blockSchema>;
export type BlockType = Block["type"];
export type BlockOf<T extends BlockType> = Extract<Block, { type: T }>;
