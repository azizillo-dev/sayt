import { LoopVideo } from "@/components/media/LoopVideo";
import { YouTubeEmbed } from "@/components/media/YouTubeEmbed";
import { Reveal } from "@/components/motion/Reveal";
import type { Block } from "@/lib/blocks/schema";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { MediaAsset, MediaMap } from "@/lib/media/types";
import { cn } from "@/lib/cn";
import { CONTENT_MAX_H } from "@/lib/media/fit";
import { BeforeAfter } from "./BeforeAfter";
import { MediaGallery } from "./MediaGallery";
import { PaletteSwatches } from "./PaletteSwatches";
import { RichText } from "./RichText";

interface Props {
  blocks: Block[];
  media: MediaMap;
  dict: Dictionary;
}

const widths = {
  text: "mx-auto max-w-3xl",
  normal: "mx-auto max-w-5xl",
  wide: "mx-auto max-w-6xl",
  full: "w-full",
} as const;

function Caption({ text }: { text: string }) {
  if (!text) return null;
  return <p className="mt-3 text-center text-sm text-muted">{text}</p>;
}

function resolve(media: MediaMap, ids: (string | null)[]): MediaAsset[] {
  return ids.map((id) => (id ? media[id] : undefined)).filter((m): m is MediaAsset => Boolean(m));
}

function BlockView({ block, media, dict }: { block: Block } & Omit<Props, "blocks">) {
  switch (block.type) {
    case "text":
      return block.text.trim() ? (
        <div className={widths.text}>
          <RichText text={block.text} />
        </div>
      ) : null;

    case "heading": {
      const Tag = block.level === 2 ? "h2" : "h3";
      return (
        <Tag
          className={cn(
            widths.text,
            "font-display font-bold tracking-tight",
            block.level === 2 ? "text-3xl sm:text-4xl" : "text-2xl sm:text-[1.75rem]",
          )}
        >
          {block.text}
        </Tag>
      );
    }

    case "image": {
      const items = resolve(media, [block.mediaId]);
      if (!items.length) return null;
      return (
        <figure className={widths[block.size]}>
          <MediaGallery items={items} columns={1} closeLabel={dict.common.close} maxHeight={CONTENT_MAX_H} />
          <Caption text={block.caption} />
        </figure>
      );
    }

    case "gallery": {
      const items = resolve(media, block.mediaIds);
      if (!items.length) return null;
      return (
        <figure className={widths.wide}>
          <MediaGallery
            items={items}
            columns={block.columns}
            closeLabel={dict.common.close}
            maxHeight={block.columns === 1 ? CONTENT_MAX_H : undefined}
          />
          <Caption text={block.caption} />
        </figure>
      );
    }

    case "video": {
      const [asset] = resolve(media, [block.mediaId]);
      if (!asset) return null;
      return (
        <figure className={widths[block.size]}>
          <LoopVideo asset={asset} maxHeight={CONTENT_MAX_H} className="rounded-card" />
          <Caption text={block.caption} />
        </figure>
      );
    }

    case "youtube":
      return (
        <figure className={widths.normal}>
          <YouTubeEmbed url={block.url} title={block.caption || "YouTube"} playLabel={dict.common.play} />
          <Caption text={block.caption} />
        </figure>
      );

    case "quote":
      return block.text.trim() ? (
        <blockquote className={cn(widths.text, "border-l-2 border-accent pl-6 sm:pl-8")}>
          <p className="font-display text-2xl font-medium leading-snug tracking-tight sm:text-3xl">{block.text}</p>
          {block.author && <footer className="mt-4 text-sm text-muted">— {block.author}</footer>}
        </blockquote>
      ) : null;

    case "divider":
      return <hr className={cn(widths.text, "border-border")} />;

    case "beforeAfter": {
      const before = block.beforeId ? media[block.beforeId] : undefined;
      const after = block.afterId ? media[block.afterId] : undefined;
      if (!before || !after) return null;
      return (
        <figure className={widths.normal}>
          <BeforeAfter before={before} after={after} maxHeight={CONTENT_MAX_H} />
          <Caption text={block.caption} />
        </figure>
      );
    }

    case "palette":
      return block.colors.length ? (
        <div className={widths.normal}>
          <PaletteSwatches colors={block.colors} />
        </div>
      ) : null;

    case "info":
      return block.items.length ? (
        <dl className={cn(widths.normal, "grid grid-cols-2 gap-x-6 gap-y-6 border-y border-border py-8 md:grid-cols-4")}>
          {block.items.map((item, i) => (
            <div key={i}>
              <dt className="text-xs uppercase tracking-[0.14em] text-muted">{item.label}</dt>
              <dd className="mt-1.5 font-medium">{item.value}</dd>
            </div>
          ))}
        </dl>
      ) : null;
  }
}

/** Renders a block document. Blocks with missing media are skipped silently. */
export function BlockRenderer({ blocks, media, dict }: Props) {
  return (
    <div className="flex flex-col gap-12 sm:gap-16">
      {blocks.map((block) => (
        // `empty:hidden` drops wrappers of blocks that rendered nothing, so they add no gap.
        <Reveal key={block.id} className="empty:hidden">
          <BlockView block={block} media={media} dict={dict} />
        </Reveal>
      ))}
    </div>
  );
}
