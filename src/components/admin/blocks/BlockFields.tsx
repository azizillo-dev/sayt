"use client";

import { Plus, X } from "lucide-react";
import { GalleryField } from "@/components/admin/media/GalleryField";
import { MediaField } from "@/components/admin/media/MediaField";
import { Button, Field, IconButton, Input, Select, Textarea } from "@/components/admin/ui";
import type { ComponentType } from "react";
import type { Block, BlockOf, BlockType } from "@/lib/blocks/schema";
import type { MediaAsset, MediaMap } from "@/lib/media/types";
import { youtubeId } from "@/lib/youtube";

export interface BlockFieldsProps<T extends Block = Block> {
  block: T;
  onChange: (block: T) => void;
  media: MediaMap;
  /** Registers freshly uploaded media so previews resolve. */
  onMedia: (asset: MediaAsset) => void;
}

const sizeOptions = [
  { value: "normal", label: "Oddiy" },
  { value: "wide", label: "Keng" },
  { value: "full", label: "To'liq kenglik" },
] as const;

function SizeSelect({ value, onChange }: { value: "normal" | "wide" | "full"; onChange: (v: "normal" | "wide" | "full") => void }) {
  return (
    <Select value={value} onChange={(e) => onChange(e.target.value as typeof value)} className="h-10 w-full text-sm sm:w-auto">
      {sizeOptions.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </Select>
  );
}

function CaptionInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder="Izoh (ixtiyoriy)" className="h-10 text-sm" />;
}

function useMediaSetter({ media, onMedia }: Pick<BlockFieldsProps, "media" | "onMedia">) {
  return {
    get: (id: string | null) => (id ? (media[id] ?? null) : null),
    set: (asset: MediaAsset | null, apply: (id: string | null) => void) => {
      if (asset) onMedia(asset);
      apply(asset?.id ?? null);
    },
  };
}

function TextFields({ block, onChange }: BlockFieldsProps<BlockOf<"text">>) {
  return (
    <div>
      <Textarea
        value={block.text}
        onChange={(e) => onChange({ ...block, text: e.target.value })}
        placeholder="Matn yozing…"
        className="min-h-28 sm:min-h-36"
      />
      <p className="mt-1.5 text-xs text-muted">
        **qalin**, *kursiv*, [havola](https://…) · bo&apos;sh qator — yangi abzats
      </p>
    </div>
  );
}

function HeadingFields({ block, onChange }: BlockFieldsProps<BlockOf<"heading">>) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <Select
        value={block.level}
        onChange={(e) => onChange({ ...block, level: Number(e.target.value) as 2 | 3 })}
        className="w-full shrink-0 sm:w-24"
      >
        <option value={2}>H2</option>
        <option value={3}>H3</option>
      </Select>
      <Input value={block.text} onChange={(e) => onChange({ ...block, text: e.target.value })} placeholder="Sarlavha" className="font-semibold" />
    </div>
  );
}

function ImageFields(props: BlockFieldsProps<BlockOf<"image">>) {
  const { block, onChange } = props;
  const media = useMediaSetter(props);
  return (
    <div className="space-y-3">
      <MediaField value={media.get(block.mediaId)} onChange={(a) => media.set(a, (mediaId) => onChange({ ...block, mediaId }))} aspect="auto" />
      <div className="flex flex-col gap-2 sm:flex-row">
        <CaptionInput value={block.caption} onChange={(caption) => onChange({ ...block, caption })} />
        <SizeSelect value={block.size} onChange={(size) => onChange({ ...block, size })} />
      </div>
    </div>
  );
}

function GalleryFields(props: BlockFieldsProps<BlockOf<"gallery">>) {
  const { block, onChange, media, onMedia } = props;
  const assets = block.mediaIds.map((id) => media[id]).filter((a): a is MediaAsset => Boolean(a));
  return (
    <div className="space-y-3">
      <GalleryField
        value={assets}
        onChange={(next) => {
          next.forEach(onMedia);
          onChange({ ...block, mediaIds: next.map((a) => a.id) });
        }}
      />
      <div className="flex flex-col gap-2 sm:flex-row">
        <CaptionInput value={block.caption} onChange={(caption) => onChange({ ...block, caption })} />
        <Select
          value={block.columns}
          onChange={(e) => onChange({ ...block, columns: Number(e.target.value) as 1 | 2 | 3 })}
          className="h-10 w-full text-sm sm:w-auto"
        >
          <option value={1}>1 ustun</option>
          <option value={2}>2 ustun</option>
          <option value={3}>3 ustun</option>
        </Select>
      </div>
    </div>
  );
}

function VideoFields(props: BlockFieldsProps<BlockOf<"video">>) {
  const { block, onChange } = props;
  const media = useMediaSetter(props);
  return (
    <div className="space-y-3">
      <MediaField
        kind="video"
        value={media.get(block.mediaId)}
        onChange={(a) => media.set(a, (mediaId) => onChange({ ...block, mediaId }))}
        aspect="auto"
      />
      <div className="flex flex-col gap-2 sm:flex-row">
        <CaptionInput value={block.caption} onChange={(caption) => onChange({ ...block, caption })} />
        <SizeSelect value={block.size} onChange={(size) => onChange({ ...block, size })} />
      </div>
    </div>
  );
}

function YoutubeFields({ block, onChange }: BlockFieldsProps<BlockOf<"youtube">>) {
  const id = youtubeId(block.url);
  return (
    <div className="space-y-3">
      <Field label="YouTube havolasi" hint={block.url && !id ? "Havola noto'g'ri ko'rinadi" : undefined}>
        <Input value={block.url} onChange={(e) => onChange({ ...block, url: e.target.value })} placeholder="https://youtu.be/…" />
      </Field>
      {id && (
        <img src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`} alt="" className="aspect-video w-full max-w-sm rounded-xl object-cover" />
      )}
      <CaptionInput value={block.caption} onChange={(caption) => onChange({ ...block, caption })} />
    </div>
  );
}

function BeforeAfterFields(props: BlockFieldsProps<BlockOf<"beforeAfter">>) {
  const { block, onChange } = props;
  const media = useMediaSetter(props);
  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Oldin">
          <MediaField value={media.get(block.beforeId)} onChange={(a) => media.set(a, (beforeId) => onChange({ ...block, beforeId }))} allowLossless={false} />
        </Field>
        <Field label="Keyin">
          <MediaField value={media.get(block.afterId)} onChange={(a) => media.set(a, (afterId) => onChange({ ...block, afterId }))} allowLossless={false} />
        </Field>
      </div>
      <p className="text-xs text-muted">Ikkala rasm bir xil o&apos;lchamda bo&apos;lsa, taqqoslash aniq chiqadi.</p>
      <CaptionInput value={block.caption} onChange={(caption) => onChange({ ...block, caption })} />
    </div>
  );
}

function PaletteFields({ block, onChange }: BlockFieldsProps<BlockOf<"palette">>) {
  const update = (i: number, patch: Partial<{ hex: string; name: string }>) =>
    onChange({ ...block, colors: block.colors.map((c, j) => (i === j ? { ...c, ...patch } : c)) });
  return (
    <div className="space-y-2">
      {block.colors.map((color, i) => (
        <div key={i} className="space-y-2 rounded-lg border border-border p-2">
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={color.hex}
              onChange={(e) => update(i, { hex: e.target.value })}
              className="h-9 w-10 shrink-0 cursor-pointer rounded-lg border border-border bg-transparent"
              aria-label="Rang"
            />
            {/* Free typing; applied on blur only when it is a complete #RRGGBB. */}
            <Input
              key={color.hex}
              defaultValue={color.hex}
              onBlur={(e) => {
                const value = e.target.value.trim();
                const hex = value.startsWith("#") ? value : `#${value}`;
                if (/^#[0-9a-fA-F]{6}$/.test(hex)) update(i, { hex: hex.toLowerCase() });
                else e.target.value = color.hex;
              }}
              className="h-9 min-w-0 flex-1 font-mono text-sm uppercase"
            />
            <IconButton label="O'chirish" onClick={() => onChange({ ...block, colors: block.colors.filter((_, j) => j !== i) })}>
              <X className="size-4" />
            </IconButton>
          </div>
          <Input value={color.name} onChange={(e) => update(i, { name: e.target.value })} placeholder="Nomi (ixtiyoriy)" className="h-9 text-sm" />
        </div>
      ))}
      {block.colors.length < 12 && (
        <Button size="sm" variant="ghost" icon={<Plus className="size-4" />} onClick={() => onChange({ ...block, colors: [...block.colors, { hex: "#888888", name: "" }] })}>
          Rang qo&apos;shish
        </Button>
      )}
    </div>
  );
}

function InfoFields({ block, onChange }: BlockFieldsProps<BlockOf<"info">>) {
  const update = (i: number, patch: Partial<{ label: string; value: string }>) =>
    onChange({ ...block, items: block.items.map((it, j) => (i === j ? { ...it, ...patch } : it)) });
  return (
    <div className="space-y-2">
      {block.items.map((item, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="grid min-w-0 flex-1 gap-2 sm:grid-cols-[12rem_1fr]">
            <Input value={item.label} onChange={(e) => update(i, { label: e.target.value })} placeholder="Nomi (Mijoz)" className="h-9 text-sm" />
            <Input value={item.value} onChange={(e) => update(i, { value: e.target.value })} placeholder="Qiymati" className="h-9 text-sm" />
          </div>
          <IconButton label="O'chirish" onClick={() => onChange({ ...block, items: block.items.filter((_, j) => j !== i) })}>
            <X className="size-4" />
          </IconButton>
        </div>
      ))}
      {block.items.length < 12 && (
        <Button size="sm" variant="ghost" icon={<Plus className="size-4" />} onClick={() => onChange({ ...block, items: [...block.items, { label: "", value: "" }] })}>
          Qator qo&apos;shish
        </Button>
      )}
    </div>
  );
}

function QuoteFields({ block, onChange }: BlockFieldsProps<BlockOf<"quote">>) {
  return (
    <div className="space-y-2">
      <Textarea value={block.text} onChange={(e) => onChange({ ...block, text: e.target.value })} placeholder="Iqtibos matni" />
      <Input value={block.author} onChange={(e) => onChange({ ...block, author: e.target.value })} placeholder="Muallif (ixtiyoriy)" className="h-10 text-sm" />
    </div>
  );
}

function DividerFields() {
  return <hr className="my-2 border-border" />;
}

/** One editor per block type — the mapped type guarantees none is missing. */
const editors: { [K in BlockType]: ComponentType<BlockFieldsProps<BlockOf<K>>> } = {
  text: TextFields,
  heading: HeadingFields,
  image: ImageFields,
  gallery: GalleryFields,
  video: VideoFields,
  youtube: YoutubeFields,
  beforeAfter: BeforeAfterFields,
  palette: PaletteFields,
  info: InfoFields,
  quote: QuoteFields,
  divider: DividerFields,
};

export function BlockFields(props: BlockFieldsProps) {
  // `editors[type]` matches `props.block`; TypeScript cannot correlate the two unions.
  const Editor = editors[props.block.type] as ComponentType<BlockFieldsProps>;
  return <Editor {...props} />;
}
