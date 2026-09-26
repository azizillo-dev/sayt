import {
  Columns2,
  Film,
  Heading,
  Image as ImageIcon,
  Images,
  Info,
  Minus,
  Palette,
  Quote,
  Type,
  SquarePlay,
  type LucideIcon,
} from "lucide-react";
import type { Block, BlockType } from "@/lib/blocks/schema";

export const blockCatalog: { type: BlockType; label: string; icon: LucideIcon }[] = [
  { type: "text", label: "Matn", icon: Type },
  { type: "heading", label: "Sarlavha", icon: Heading },
  { type: "image", label: "Rasm", icon: ImageIcon },
  { type: "gallery", label: "Galereya", icon: Images },
  { type: "video", label: "Video (10s)", icon: Film },
  { type: "youtube", label: "YouTube", icon: SquarePlay },
  { type: "beforeAfter", label: "Oldin / Keyin", icon: Columns2 },
  { type: "palette", label: "Ranglar", icon: Palette },
  { type: "info", label: "Ma'lumot", icon: Info },
  { type: "quote", label: "Iqtibos", icon: Quote },
  { type: "divider", label: "Ajratgich", icon: Minus },
];

export const blockMeta = Object.fromEntries(blockCatalog.map((b) => [b.type, b])) as Record<
  BlockType,
  (typeof blockCatalog)[number]
>;

export function newBlockId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function createBlock(type: BlockType): Block {
  const id = newBlockId();
  switch (type) {
    case "text":
      return { id, type, text: "" };
    case "heading":
      return { id, type, level: 2, text: "" };
    case "image":
      return { id, type, mediaId: null, caption: "", size: "normal" };
    case "gallery":
      return { id, type, mediaIds: [], columns: 2, caption: "" };
    case "video":
      return { id, type, mediaId: null, caption: "", size: "normal" };
    case "youtube":
      return { id, type, url: "", caption: "" };
    case "beforeAfter":
      return { id, type, beforeId: null, afterId: null, caption: "" };
    case "palette":
      return { id, type, colors: [{ hex: "#111111", name: "" }] };
    case "info":
      return {
        id,
        type,
        items: [
          { label: "Mijoz", value: "" },
          { label: "Yil", value: String(new Date().getFullYear()) },
          { label: "Xizmat", value: "" },
        ],
      };
    case "quote":
      return { id, type, text: "", author: "" };
    case "divider":
      return { id, type };
  }
}
