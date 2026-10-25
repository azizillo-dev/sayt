/**
 * Publishes the portfolio + video sections from the local database to
 * production — additively. Production is edited by the client through the
 * admin panel, so nothing that already exists there is overwritten:
 *
 *   - media rows and items are inserted with their local ids, skipping ids
 *     production already has;
 *   - settings change only in `portfolio` (the four section covers) and the
 *     hero "focus" list, renamed to match the portfolio sections.
 *
 * It prints the storage keys the new rows need; `--upload` also copies those
 * files from ./storage to the production bucket.
 *
 *   node scripts/sync-portfolio-to-prod.mjs            # dry run: report only
 *   node scripts/sync-portfolio-to-prod.mjs --apply --upload
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import postgres from "postgres";

const apply = process.argv.includes("--apply");
const upload = process.argv.includes("--upload");

process.loadEnvFile(".env");
const local = postgres(process.env.DATABASE_URL, { prepare: false });
const prodEnv = Object.fromEntries(
  (await readFile(".env.production.local", "utf8"))
    .split(/\r?\n/)
    .filter((line) => /^[A-Z0-9_]+=/.test(line))
    .map((line) => [line.slice(0, line.indexOf("=")), line.slice(line.indexOf("=") + 1)]),
);
// Direct (non-pooled) endpoint: a transaction is used below.
const prod = postgres(prodEnv.DATABASE_URL.replace("-pooler", "").replace("&channel_binding=require", ""), { prepare: false });

const HERO_RENAMES = [
  ["Advertising & Marketing", "Advertising Design"],
  ["Visual Campaigns", "Visual Design"],
];

const portfolio = await local`select * from portfolio_items where is_published order by category, sort_order`;
const videos = await local`select * from video_items where is_published order by sort_order`;
const [localSettings] = await local`select data from settings where id = 1`;
const covers = localSettings.data.portfolio?.covers ?? {};

const mediaIds = [
  ...new Set([
    ...Object.values(covers),
    ...portfolio.flatMap((p) => [p.cover_id, ...p.gallery_ids]),
    ...videos.flatMap((v) => [v.cover_id, v.video_id]),
  ].filter(Boolean)),
];
const media = await local`select * from media where id in ${local(mediaIds)}`;
if (media.length !== mediaIds.length) throw new Error(`local media missing: ${mediaIds.length - media.length}`);

const existingMedia = new Set((await prod`select id from media where id in ${prod(mediaIds)}`).map((r) => r.id));
const existingPortfolio = new Set((await prod`select id from portfolio_items`).map((r) => r.id));
const existingVideos = new Set((await prod`select id from video_items`).map((r) => r.id));

const newMedia = media.filter((m) => !existingMedia.has(m.id));
const newPortfolio = portfolio.filter((p) => !existingPortfolio.has(p.id));
const newVideos = videos.filter((v) => !existingVideos.has(v.id));

const keys = [
  ...newMedia.flatMap((m) => [m.original_key, ...(m.variants ?? []).map((v) => v.key)]),
  ...newPortfolio.map((p) => p.pdf_key).filter(Boolean),
];

console.log(`media:     ${newMedia.length} new (${media.length - newMedia.length} already in production)`);
console.log(`portfolio: ${newPortfolio.length} new items`);
console.log(`videos:    ${newVideos.length} new items`);
console.log(`files:     ${keys.length} to upload`);

if (apply) {
  await prod.begin(async (tx) => {
    for (const m of newMedia) await tx`insert into media ${tx(m)} on conflict (id) do nothing`;
    for (const p of newPortfolio) await tx`insert into portfolio_items ${tx(p)} on conflict (id) do nothing`;
    for (const v of newVideos) await tx`insert into video_items ${tx(v)} on conflict (id) do nothing`;

    const [row] = await tx`select data from settings where id = 1`;
    const data = row.data;
    data.portfolio = { coverId: null, covers };
    for (const column of data.hero?.columns ?? []) {
      for (const locale of Object.keys(column.items ?? {})) {
        for (const [from, to] of HERO_RENAMES) column.items[locale] = column.items[locale].replaceAll(from, to);
      }
    }
    await tx`update settings set data = ${tx.json(data)}, updated_at = now() where id = 1`;
  });
  console.log("database: applied");
}

if (upload) {
  const s3 = new S3Client({
    region: prodEnv.S3_REGION || "auto",
    endpoint: prodEnv.S3_ENDPOINT,
    forcePathStyle: true,
    credentials: { accessKeyId: prodEnv.S3_ACCESS_KEY_ID, secretAccessKey: prodEnv.S3_SECRET_ACCESS_KEY },
  });
  const TYPES = { ".avif": "image/avif", ".webp": "image/webp", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".mp4": "video/mp4", ".webm": "video/webm", ".pdf": "application/pdf", ".svg": "image/svg+xml" };
  let done = 0;
  let bytes = 0;
  const queue = [...keys];
  await Promise.all(
    Array.from({ length: 6 }, async () => {
      for (let key = queue.shift(); key; key = queue.shift()) {
        const body = await readFile(path.join("storage", ...key.split("/")));
        await s3.send(new PutObjectCommand({
          Bucket: prodEnv.S3_BUCKET,
          Key: key,
          Body: body,
          ContentType: TYPES[path.extname(key).toLowerCase()] ?? "application/octet-stream",
          CacheControl: "public, max-age=31536000, immutable",
        }));
        bytes += body.length;
        if (++done % 20 === 0 || done === keys.length) console.log(`  uploaded ${done}/${keys.length}  ${(bytes / 1048576).toFixed(1)} MB`);
      }
    }),
  );
}

await local.end();
await prod.end();
