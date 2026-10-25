/** Import the assets Samariddin Aka sent on 22 October 2026.
 * Run: node --conditions=react-server --env-file=.env --import tsx scripts/import-samariddin-portfolio.ts "D:\\Downloads\\Telegram Desktop\\ChatExport_2026-10-25"
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import { and, eq, inArray } from "drizzle-orm";
import { db, schema } from "../src/db/index";
import { ingestImage, ingestPdf, ingestVideo, originalKey } from "../src/lib/media/service";
import { settingsSchema } from "../src/lib/settings/schema";
import { storage } from "../src/lib/storage/index";

const exportDir = process.argv[2];
if (!exportDir) throw new Error("Telegram export directory is required");
const filesDir = path.join(exportDir, "files");
const stockDir = path.join(exportDir, "stock-videos");
const prefix = "samariddin-2026-10-22-";

async function image(name: string): Promise<string> {
  const fileName = prefix + name;
  const existing = await db.query.media.findFirst({ where: eq(schema.media.fileName, fileName) });
  if (existing) return existing.id;
  const key = originalKey("image/png", "image");
  const source = name === "Social Media corrected.png"
    ? path.join(process.cwd(), "public", "portfolio-social-media-corrected.png")
    : path.join(filesDir, name);
  await storage.put(key, await readFile(source), "image/png");
  const saved = await ingestImage({ key, mimeType: "image/png", fileName, lossless: false });
  console.log(`Image: ${name}`);
  return saved.id;
}

async function pdf(name: string): Promise<string> {
  const key = originalKey("application/pdf", "pdf");
  await storage.put(key, await readFile(path.join(filesDir, name)), "application/pdf");
  await ingestPdf({ key, fileName: name });
  console.log(`PDF: ${name}`);
  return key;
}

async function video(name: string): Promise<string> {
  const fileName = prefix + name;
  const existing = await db.query.media.findFirst({ where: eq(schema.media.fileName, fileName) });
  if (existing) return existing.id;
  const key = originalKey("video/mp4", "video");
  await storage.put(key, await readFile(path.join(filesDir, name)), "video/mp4");
  const saved = await ingestVideo({ key, mimeType: "video/mp4", fileName, width: 1080, height: 1920 });
  console.log(`Video: ${name}`);
  return saved.id;
}

const coverFiles = {
  "logo-branding": "Logo Branding.png",
  "social-media": "Social Media corrected.png",
  "advertising-design": "3.png",
  "visual-design": "2.png",
} as const;

const works = [
  { category: "logo-branding", title: "VitaNext — brend qo‘llanmasi", cover: "GUIDBOOK---Copy.png", gallery: ["GUIDBOOK---Copy.png"], pdf: "GUIDBOOK - Copy.pdf" },
  { category: "social-media", title: "Art House — Musaffo", cover: "101.png", gallery: ["101.png"] },
  { category: "social-media", title: "Billur Chinni", cover: "4.png", gallery: ["4.png"] },
  { category: "social-media", title: "Japan Plaza", cover: "Artboard 1 copy 52.png", gallery: ["Artboard 1 copy 52.png"] },
  { category: "social-media", title: "Avtomobil reklamasi", cover: "Artboard 1 copy 7.png", gallery: ["Artboard 1 copy 7.png"] },
  { category: "advertising-design", title: "HoneyMoon — qadoq dizayni", cover: "Artboard 1.png", gallery: ["Artboard 1.png", "Artboard 5.png"] },
  { category: "advertising-design", title: "CESAM — reklama dizayni", cover: "1 copy 28.png", gallery: ["1 copy 28.png", "Artboard 1 (1).png"] },
  { category: "visual-design", title: "NAV FIT — vizual tizim", cover: "Artboard 2 copy.png", gallery: ["Artboard 2 copy.png", "Group 2 copy 2.png", "Vector-Smart-Object.png"] },
  { category: "logo-branding", title: "Demo — VitaNext logotip qoidalari", cover: "demo-vitanext-page-3.png", gallery: ["demo-vitanext-page-3.png"] },
  { category: "logo-branding", title: "Demo — VitaNext logo versiyalari", cover: "demo-vitanext-page-5.png", gallery: ["demo-vitanext-page-5.png"] },
  { category: "logo-branding", title: "Demo — VitaNext rang palitrasi", cover: "demo-vitanext-page-7.png", gallery: ["demo-vitanext-page-7.png"] },
  { category: "advertising-design", title: "Demo — HoneyMoon taqdimoti", cover: "Artboard 5.png", gallery: ["Artboard 5.png"] },
  { category: "advertising-design", title: "Demo — CESAM posteri", cover: "Artboard 1 (1).png", gallery: ["Artboard 1 (1).png"] },
  { category: "visual-design", title: "Demo — NAV FIT kompozitsiyasi", cover: "Group 2 copy 2.png", gallery: ["Group 2 copy 2.png"] },
  { category: "visual-design", title: "Demo — NAV FIT belgilar", cover: "Vector-Smart-Object.png", gallery: ["Vector-Smart-Object.png"] },
  { category: "visual-design", title: "Demo — ranglar kompozitsiyasi", cover: "6c0b4247-2ec7-4273-8d51-a37a610b15c3.png", gallery: ["6c0b4247-2ec7-4273-8d51-a37a610b15c3.png"] },
] as const;

const oldTitles = [
  "Choyxona — reklama", "Choyxona — qadoq", "Choyxona — banner", "Choyxona — taqdimot",
  "Aral Tech — logotip", "Aral Tech — belgilar", "Aral Tech — ranglar", "Aral Tech — qo'llanish",
  "Tashkent Jazz — asosiy post", "Tashkent Jazz — e'lon", "Tashkent Jazz — hikoya", "Tashkent Jazz — afisha",
  "Safar — kampaniya", "Safar — vizual 01", "Safar — vizual 02", "Safar — vizual 03",
];

await db.update(schema.portfolioItems).set({ isPublished: false }).where(inArray(schema.portfolioItems.title, oldTitles));

const covers = {} as Record<keyof typeof coverFiles, string>;
for (const [category, name] of Object.entries(coverFiles)) {
  covers[category as keyof typeof coverFiles] = await image(name);
}

for (const [index, work] of works.entries()) {
  const existing = await db.query.portfolioItems.findFirst({ where: and(eq(schema.portfolioItems.category, work.category), eq(schema.portfolioItems.title, work.title)) });
  const galleryIds: string[] = [];
  for (const name of work.gallery) galleryIds.push(await image(name));
  const pdfName = "pdf" in work ? work.pdf : null;
  const pdfKey = pdfName ? existing?.pdfKey ?? await pdf(pdfName) : null;
  const values = {
    category: work.category,
    title: work.title,
    coverId: await image(work.cover),
    galleryIds,
    openMode: pdfName ? "pdf" : "gallery",
    pdfKey,
    pdfName,
    isPublished: true,
    sortOrder: index,
    updatedAt: new Date(),
  };
  if (existing) await db.update(schema.portfolioItems).set(values).where(eq(schema.portfolioItems.id, existing.id));
  else await db.insert(schema.portfolioItems).values(values);
  console.log(`Portfolio: ${work.title}`);
}

const filmTitle = "CESAM — animatsiya";
const existingFilm = await db.query.videoItems.findFirst({ where: eq(schema.videoItems.title, filmTitle) });
const filmValues = {
  title: filmTitle,
  coverId: await image("Artboard 1 (1).png"),
  videoId: await video("animatsiya2.1.mp4"),
  isPublished: true,
  sortOrder: 0,
  updatedAt: new Date(),
};
if (existingFilm) await db.update(schema.videoItems).set(filmValues).where(eq(schema.videoItems.id, existingFilm.id));
else await db.insert(schema.videoItems).values(filmValues);

// Local preview clips from Mixkit's Stock Video Free License. Source links are
// recorded beside the downloaded originals in stock-videos/SOURCES.txt.
const stockClips = [
  { file: "turquoise-waves", title: "Demo — Turkuaz to‘lqinlar" },
  { file: "liquid-motion", title: "Demo — Rangli harakat" },
  { file: "blue-waves", title: "Demo — Moviy to‘lqinlar" },
] as const;

async function stockMedia(name: string, kind: "image" | "video"): Promise<string> {
  const fileName = `mixkit-demo-${name}.${kind === "image" ? "png" : "mp4"}`;
  const existing = await db.query.media.findFirst({ where: eq(schema.media.fileName, fileName) });
  if (existing) return existing.id;
  const mimeType = kind === "image" ? "image/png" : "video/mp4";
  const key = originalKey(mimeType, kind);
  await storage.put(key, await readFile(path.join(stockDir, fileName.replace("mixkit-demo-", ""))), mimeType);
  return kind === "image"
    ? (await ingestImage({ key, mimeType, fileName, lossless: false })).id
    : (await ingestVideo({ key, mimeType, fileName, width: 720, height: 1280 })).id;
}

for (const [index, clip] of stockClips.entries()) {
  const existing = await db.query.videoItems.findFirst({ where: eq(schema.videoItems.title, clip.title) });
  const values = {
    title: clip.title,
    coverId: await stockMedia(clip.file, "image"),
    videoId: await stockMedia(clip.file, "video"),
    isPublished: true,
    sortOrder: index + 1,
    updatedAt: new Date(),
  };
  if (existing) await db.update(schema.videoItems).set(values).where(eq(schema.videoItems.id, existing.id));
  else await db.insert(schema.videoItems).values(values);
  console.log(`Stock video: ${clip.title}`);
}

const settingsRow = await db.query.settings.findFirst();
const settings = settingsSchema.parse(settingsRow?.data ?? {});
settings.portfolio.covers = covers;
for (const column of settings.hero.columns) {
  for (const locale of ["uz", "ru", "en"] as const) {
    column.items[locale] = column.items[locale]
      .replaceAll("Advertising & Marketing", "Advertising Design")
      .replaceAll("Visual Campaigns", "Visual Design");
  }
}
await db.insert(schema.settings).values({ id: 1, data: settings })
  .onConflictDoUpdate({ target: schema.settings.id, set: { data: settings, updatedAt: new Date() } });
console.log("Done: 4 covers, 16 portfolio works, 4 portrait videos; old samples hidden.");
process.exit(0);
