/**
 * Gathers every media file into Cloudflare R2, under the same keys:
 *
 *   - everything in the current production bucket (Neon Object Storage),
 *   - everything in the local ./storage folder (work not yet in production).
 *
 * Media rows store keys, not URLs, so once the files are in R2 the site only
 * needs its S3_* settings pointed at R2 — no database change. Files already in
 * R2 are skipped, so the script is safe to re-run. It also sets the bucket's
 * CORS rule, which direct uploads from the admin panel need.
 *
 *   node scripts/migrate-to-r2.mjs            # dry run: counts only
 *   node scripts/migrate-to-r2.mjs --apply
 *
 * Reads .env.production.local (source) and .env.r2.local (destination).
 */
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import {
  GetObjectCommand,
  ListObjectsV2Command,
  PutBucketCorsCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

const apply = process.argv.includes("--apply");
const CACHE = "public, max-age=31536000, immutable";
const TYPES = {
  ".avif": "image/avif", ".webp": "image/webp", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
  ".gif": "image/gif", ".tiff": "image/tiff", ".svg": "image/svg+xml", ".mp4": "video/mp4", ".webm": "video/webm",
  ".pdf": "application/pdf",
};
const typeOf = (key) => TYPES[path.extname(key).toLowerCase()] ?? "application/octet-stream";

async function readEnv(file) {
  const text = await readFile(file, "utf8");
  return Object.fromEntries(
    text.split(/\r?\n/).filter((l) => /^[A-Z0-9_]+=/.test(l)).map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1)]),
  );
}

function client(env, label) {
  for (const name of ["S3_ENDPOINT", "S3_BUCKET", "S3_ACCESS_KEY_ID", "S3_SECRET_ACCESS_KEY"]) {
    if (!env[name]) throw new Error(`${label}: ${name} is empty`);
  }
  return {
    bucket: env.S3_BUCKET,
    s3: new S3Client({
      region: env.S3_REGION || "auto",
      endpoint: env.S3_ENDPOINT,
      forcePathStyle: true,
      credentials: { accessKeyId: env.S3_ACCESS_KEY_ID, secretAccessKey: env.S3_SECRET_ACCESS_KEY },
    }),
  };
}

async function listKeys({ s3, bucket }) {
  const keys = new Set();
  let token;
  do {
    const page = await s3.send(new ListObjectsV2Command({ Bucket: bucket, ContinuationToken: token }));
    for (const item of page.Contents ?? []) keys.add(item.Key);
    token = page.IsTruncated ? page.NextContinuationToken : undefined;
  } while (token);
  return keys;
}

async function localKeys() {
  const root = path.resolve("storage");
  const entries = await readdir(root, { recursive: true, withFileTypes: true }).catch(() => []);
  return new Map(
    entries
      .filter((e) => e.isFile())
      .map((e) => {
        const file = path.join(e.parentPath, e.name);
        return [path.relative(root, file).split(path.sep).join("/"), file];
      }),
  );
}

const source = client(await readEnv(".env.production.local"), "production bucket");
const r2Env = await readEnv(".env.r2.local");
const target = client(r2Env, ".env.r2.local");

const [inSource, inLocal, inTarget] = await Promise.all([listKeys(source), localKeys(), listKeys(target)]);
// Production wins where a key exists in both: it is what visitors see today.
const fromSource = [...inSource].filter((key) => !inTarget.has(key));
const fromLocal = [...inLocal.keys()].filter((key) => !inSource.has(key) && !inTarget.has(key));

console.log(`production bucket: ${inSource.size} files`);
console.log(`local storage:     ${inLocal.size} files (${[...inLocal.keys()].filter((k) => !inSource.has(k)).length} not in production)`);
console.log(`already in R2:     ${inTarget.size}`);
console.log(`to copy:           ${fromSource.length} from production + ${fromLocal.length} from local`);

if (!apply) {
  console.log("\ndry run — add --apply to copy");
  process.exit(0);
}

// Needs an admin token; an "Object Read & Write" token may set it from the dashboard instead.
try {
  await target.s3.send(
    new PutBucketCorsCommand({
      Bucket: target.bucket,
      CORSConfiguration: {
        CORSRules: [
          {
            // The presigned signature is the credential; CORS only lets a page read the reply.
            AllowedOrigins: ["*"],
            AllowedMethods: ["GET", "HEAD", "PUT"],
            AllowedHeaders: ["Content-Type", "Cache-Control", "Range"],
            ExposeHeaders: ["Content-Length", "Content-Range"],
            MaxAgeSeconds: 3600,
          },
        ],
      },
    }),
  );
  console.log("CORS set");
} catch (error) {
  console.warn(`CORS not set (${error.name}) — add it in the dashboard: R2 → bucket → Settings → CORS policy`);
}

const jobs = [
  ...fromSource.map((key) => async () => {
    const object = await source.s3.send(new GetObjectCommand({ Bucket: source.bucket, Key: key }));
    return { key, body: Buffer.from(await object.Body.transformToByteArray()) };
  }),
  ...fromLocal.map((key) => async () => ({ key, body: await readFile(inLocal.get(key)) })),
];

/** A dropped connection on one file should not end a run of hundreds. */
async function retry(fn, attempts = 4) {
  for (let i = 1; ; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i >= attempts) throw error;
      await new Promise((r) => setTimeout(r, 1000 * i));
    }
  }
}

let done = 0;
let bytes = 0;
await Promise.all(
  Array.from({ length: 8 }, async () => {
    for (let job = jobs.shift(); job; job = jobs.shift()) {
      const { key, body } = await retry(job);
      await retry(() =>
        target.s3.send(new PutObjectCommand({ Bucket: target.bucket, Key: key, Body: body, ContentType: typeOf(key), CacheControl: CACHE })),
      );
      bytes += body.length;
      if (++done % 25 === 0 || jobs.length === 0) console.log(`  ${done} copied, ${(bytes / 1048576).toFixed(1)} MB`);
    }
  }),
);

// Proof the public address serves what was copied.
if (r2Env.S3_PUBLIC_URL) {
  const sample = [...(await listKeys(target))].find((key) => key.endsWith(".avif"));
  const res = await fetch(`${r2Env.S3_PUBLIC_URL.replace(/\/+$/, "")}/${sample}`, { method: "HEAD" });
  console.log(`public check: ${res.status} ${res.headers.get("content-type")} ${res.headers.get("cache-control")}`);
}
console.log("done");
