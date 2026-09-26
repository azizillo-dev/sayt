"use client";

import { ArrowDown, ArrowUp, Copy, Trash2 } from "lucide-react";
import { motion } from "motion/react";
import { Sortable } from "@/components/admin/Sortable";
import { IconButton } from "@/components/admin/ui";
import type { Block, BlockType } from "@/lib/blocks/schema";
import type { MediaAsset, MediaMap } from "@/lib/media/types";
import { BlockFields } from "./BlockFields";
import { blockCatalog, blockMeta, createBlock, newBlockId } from "./catalog";

interface Props {
  blocks: Block[];
  onChange: (blocks: Block[]) => void;
  media: MediaMap;
  onMedia: (asset: MediaAsset) => void;
}

export function BlockEditor({ blocks, onChange, media, onMedia }: Props) {
  const add = (type: BlockType) => onChange([...blocks, createBlock(type)]);
  const update = (next: Block) => onChange(blocks.map((b) => (b.id === next.id ? next : b)));

  /** Arrow buttons: reordering without dragging, which is fiddly on a phone. */
  const move = (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= blocks.length) return;
    const next = [...blocks];
    [next[index], next[target]] = [next[target]!, next[index]!];
    onChange(next);
  };

  const duplicate = (index: number) => {
    const copy = { ...structuredClone(blocks[index]!), id: newBlockId() };
    onChange([...blocks.slice(0, index + 1), copy, ...blocks.slice(index + 1)]);
  };

  const remove = (block: Block) => {
    if (block.type !== "divider" && !window.confirm(`"${blockMeta[block.type].label}" blokini o'chirasizmi?`)) return;
    onChange(blocks.filter((b) => b.id !== block.id));
  };

  return (
    <div className="space-y-2.5">
      <Sortable items={blocks} onReorder={onChange} className="space-y-2.5">
        {(block, handle, index) => {
          const { icon: Icon, label } = blockMeta[block.type];
          return (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-border bg-bg/60">
              <div className="flex items-center gap-0.5 border-b border-border px-1.5 py-1">
                {/* Dragging is a desktop nicety; phones use the arrows. */}
                <span className="hidden sm:block">{handle}</span>
                <Icon className="ml-1.5 size-4 shrink-0 text-muted" />
                <span className="ml-1.5 min-w-0 truncate text-xs font-bold uppercase tracking-wide text-muted">{label}</span>
                <span className="ml-auto flex">
                  <IconButton label="Yuqoriga" onClick={() => move(index, -1)} disabled={index === 0}>
                    <ArrowUp className="size-4" />
                  </IconButton>
                  <IconButton label="Pastga" onClick={() => move(index, 1)} disabled={index === blocks.length - 1}>
                    <ArrowDown className="size-4" />
                  </IconButton>
                  <IconButton label="Nusxalash" onClick={() => duplicate(index)} className="max-sm:hidden">
                    <Copy className="size-4" />
                  </IconButton>
                  <IconButton label="O'chirish" onClick={() => remove(block)} className="hover:text-red-400">
                    <Trash2 className="size-4" />
                  </IconButton>
                </span>
              </div>
              <div className="p-3 sm:p-4">
                <BlockFields block={block} onChange={update} media={media} onMedia={onMedia} />
              </div>
            </motion.div>
          );
        }}
      </Sortable>

      {blocks.length === 0 && <p className="py-3 text-center text-sm text-muted">Hali blok yo&apos;q — pastdan birini qo&apos;shing.</p>}

      <div className="flex flex-wrap gap-1.5 rounded-xl border border-dashed border-border p-2.5">
        {blockCatalog.map(({ type, label, icon: Icon }) => (
          <button
            key={type}
            type="button"
            onClick={() => add(type)}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-surface px-2.5 text-[13px] font-semibold transition-colors hover:border-accent hover:text-accent"
          >
            <Icon className="size-4" />
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
