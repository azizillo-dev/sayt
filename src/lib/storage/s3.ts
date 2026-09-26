import "server-only";
import { DeleteObjectsCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { IMMUTABLE_CACHE } from "@/lib/media/limits";
import type { StorageDriver } from ".";

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required when STORAGE_DRIVER=s3`);
  return value;
}

/**
 * Any S3-compatible bucket — Neon Object Storage, Cloudflare R2, AWS S3.
 * The bucket must allow anonymous reads: visitors load files straight from it.
 */
export function s3StorageDriver(): StorageDriver {
  const bucket = required("S3_BUCKET");
  const endpoint = required("S3_ENDPOINT").replace(/\/+$/, "");
  // Path-style by default (`endpoint/bucket/key`), which every provider serves;
  // set S3_PUBLIC_URL for a CDN or custom domain in front of the bucket.
  const publicBase = (process.env.S3_PUBLIC_URL || `${endpoint}/${bucket}`).replace(/\/+$/, "");

  const client = new S3Client({
    region: process.env.S3_REGION || "auto",
    endpoint,
    forcePathStyle: true,
    credentials: {
      accessKeyId: required("S3_ACCESS_KEY_ID"),
      secretAccessKey: required("S3_SECRET_ACCESS_KEY"),
    },
  });

  return {
    async put(key, body, contentType) {
      await client.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: body,
          ContentType: contentType,
          CacheControl: IMMUTABLE_CACHE,
        }),
      );
    },
    async get(key) {
      const object = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
      return Buffer.from(await object.Body!.transformToByteArray());
    },
    async uploadUrl(key, contentType) {
      // 15 minutes is long enough for a large file on a slow connection and
      // short enough that a leaked URL is worthless.
      return getSignedUrl(
        client,
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          ContentType: contentType,
          CacheControl: IMMUTABLE_CACHE,
        }),
        { expiresIn: 900 },
      );
    },
    async delete(keys) {
      if (keys.length === 0) return;
      await client.send(
        new DeleteObjectsCommand({
          Bucket: bucket,
          Delete: { Objects: keys.map((Key) => ({ Key })), Quiet: true },
        }),
      );
    },
    publicUrl(key) {
      return `${publicBase}/${key}`;
    },
  };
}
