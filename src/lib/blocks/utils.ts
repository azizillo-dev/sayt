import type { Block } from "./schema";

/**
 * Returns a copy of `blocks` with every human-readable string passed through
 * `fn`. Used to collect strings for translation and to write them back.
 * Media references, URLs and colours are never touched.
 */
export function mapBlockTexts(blocks: Block[], fn: (text: string) => string): Block[] {
  return blocks.map((block): Block => {
    switch (block.type) {
      case "text":
      case "heading":
        return { ...block, text: fn(block.text) };
      case "image":
      case "gallery":
      case "video":
      case "youtube":
      case "beforeAfter":
        return { ...block, caption: fn(block.caption) };
      case "quote":
        return { ...block, text: fn(block.text), author: fn(block.author) };
      case "palette":
        return { ...block, colors: block.colors.map((c) => ({ ...c, name: fn(c.name) })) };
      case "info":
        return {
          ...block,
          items: block.items.map((i) => ({ label: fn(i.label), value: fn(i.value) })),
        };
      case "divider":
        return block;
    }
  });
}

/** Every media id referenced by the blocks, so pages can load them in one query. */
export function collectMediaIds(blocks: Block[]): string[] {
  const ids = new Set<string>();
  const add = (id: string | null) => id && ids.add(id);
  for (const block of blocks) {
    switch (block.type) {
      case "image":
      case "video":
        add(block.mediaId);
        break;
      case "gallery":
        block.mediaIds.forEach(add);
        break;
      case "beforeAfter":
        add(block.beforeId);
        add(block.afterId);
        break;
    }
  }
  return [...ids];
}
