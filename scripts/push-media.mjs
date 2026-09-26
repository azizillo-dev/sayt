/**
 * Copies every file from the local ./storage folder to the S3 bucket, under
 * the same keys. Media rows store keys, not URLs, so once the files are there
 * the site only needs STORAGE_DRIVER=s3 — nothing in the database changes.
 *
 *   npm run media:push                            # S3_* from .env
 *   npm run media:push -- .env.production.local   # or from another file
 *
 * Safe to re-run: keys are unique per upload, files are simply overwritten.
 */
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

process.loadEnvFile(process.argv[2] ?? ".env");

const ROOT = path.resolve("storage");
const CONCURRENCY = 8;
const CACHE = "public, max-age=31536000, immutable";

const TYPES = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".gif": "image/gif",
  ".tiff": "image/tiff",
  ".svg": "image/svg+xml",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
};

function env(name) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is missing`);
  return value;
}

const client = new S3Client({
  region: process.env.S3_REGION || "auto",
  endpoint: env("S3_ENDPOINT"),
  forcePathStyle: true,
  credentials: { accessKeyId: env("S3_ACCESS_KEY_ID"), secretAccessKey: env("S3_SECRET_ACCESS_KEY") },
});
const bucket = env("S3_BUCKET");

const entries = await readdir(ROOT, { recursive: true, withFileTypes: true });
const files = entries
  .filter((e) => e.isFile())
  .map((e) => path.join(e.parentPath, e.name))
  // Keys always use forward slashes, whatever the local OS.
  .map((file) => ({ file, key: path.relative(ROOT, file).split(path.sep).join("/") }));

console.log(`${files.length} files → ${bucket}`);

let done = 0;
let bytes = 0;
const queue = [...files];

async function worker() {
  for (let item = queue.shift(); item; item = queue.shift()) {
    const body = await readFile(item.file);
    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: item.key,
        Body: body,
        ContentType: TYPES[path.extname(item.key).toLowerCase()] ?? "application/octet-stream",
        CacheControl: CACHE,
      }),
    );
    bytes += body.length;
    if (++done % 25 === 0 || done === files.length) {
      console.log(`  ${done}/${files.length}  ${(bytes / 1024 / 1024).toFixed(1)} MB`);
    }
  }
}

await Promise.all(Array.from({ length: CONCURRENCY }, worker));
console.log("done");
