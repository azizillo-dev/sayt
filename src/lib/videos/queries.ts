import "server-only";
import { asc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { getMediaMap } from "@/lib/media/service";
import type { MediaAsset, MediaMap } from "@/lib/media/types";

export interface VideoDisplayItem {
  id: string;
  title: string;
  cover: MediaAsset;
  src: string;
}

export async function getVideos({ publishedOnly = true, limit }: { publishedOnly?: boolean; limit?: number } = {}): Promise<VideoDisplayItem[]> {
  const query = db.select().from(schema.videoItems)
    .where(publishedOnly ? eq(schema.videoItems.isPublished, true) : undefined)
    .orderBy(asc(schema.videoItems.sortOrder), asc(schema.videoItems.createdAt));
  const rows = await (limit ? query.limit(limit) : query);
  const media = await getMediaMap(rows.flatMap((row) => [row.coverId, row.videoId]));
  return rows.flatMap((row) => {
    const cover = media[row.coverId];
    const video = media[row.videoId];
    return cover?.kind === "image" && video?.kind === "video"
      ? [{ id: row.id, title: row.title, cover, src: video.url }]
      : [];
  });
}

export async function listVideoItems() {
  const rows = await db.select().from(schema.videoItems).orderBy(asc(schema.videoItems.sortOrder), asc(schema.videoItems.createdAt));
  const media = await getMediaMap(rows.flatMap((row) => [row.coverId, row.videoId]));
  return rows.map((row) => ({ ...row, cover: media[row.coverId] ?? null }));
}

export async function loadVideoItem(id: string | null): Promise<{ initial: {
  id: string | null;
  title: string;
  coverId: string | null;
  videoId: string | null;
  isPublished: boolean;
}; media: MediaMap } | null> {
  if (!id) return { initial: { id: null, title: "", coverId: null, videoId: null, isPublished: true }, media: {} };
  const row = await db.query.videoItems.findFirst({ where: eq(schema.videoItems.id, id) });
  if (!row) return null;
  return {
    initial: { id: row.id, title: row.title, coverId: row.coverId, videoId: row.videoId, isPublished: row.isPublished },
    media: await getMediaMap([row.coverId, row.videoId]),
  };
}
