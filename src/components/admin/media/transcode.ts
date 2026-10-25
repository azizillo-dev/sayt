import { ALL_FORMATS, BlobSource, BufferTarget, Conversion, Input, Mp4OutputFormat, Output, Quality } from "mediabunny";

/**
 * Re-encodes a video in the browser before it is uploaded, using the
 * computer's own (usually hardware) H.264 encoder through WebCodecs.
 *
 * Designers export at editing quality — the first reel was 10.5 Mbit/s,
 * 17.6 MB for 14 seconds — which stalls on a phone. Two files are made:
 *
 *   - `video`:   what the reel viewer plays — at most 1280 px tall, ~2.5 Mbit/s;
 *   - `preview`: what the silent looping cards play — 640 px tall, ~0.6 Mbit/s,
 *                no sound, first PREVIEW_SECONDS only.
 *
 * Both are written "fast start" (index before the data), so playback can
 * begin as soon as the first bytes arrive instead of after the whole file.
 */

const VIDEO = { height: 1280, bitrate: 2_500_000 };
const PREVIEW = { height: 640, bitrate: 600_000 };
const PREVIEW_SECONDS = 8;

export interface Transcoded {
  video: File;
  preview: File;
  width: number;
  height: number;
}

async function encode(
  file: File,
  { height, bitrate, audio, end }: { height: number; bitrate: number; audio: boolean; end?: number },
  onProgress: (ratio: number) => void,
): Promise<{ bytes: ArrayBuffer; width: number; height: number }> {
  const input = new Input({ formats: ALL_FORMATS, source: new BlobSource(file) });
  const track = await input.getPrimaryVideoTrack();
  if (!track) throw new Error("Videoda tasvir topilmadi");
  // Never upscale: a 720 px export stays 720 px.
  const outHeight = Math.min(height, track.displayHeight);
  const outWidth = Math.round((track.displayWidth / track.displayHeight) * outHeight / 2) * 2;

  const output = new Output({ format: new Mp4OutputFormat({ fastStart: "in-memory" }), target: new BufferTarget() });
  const conversion = await Conversion.init({
    input,
    output,
    video: { width: outWidth, height: outHeight, fit: "contain", codec: "avc", quality: new Quality({ bitrate, bitrateMode: "variable" }), keyFrameInterval: 2 },
    audio: audio ? { codec: "aac", quality: new Quality({ bitrate: 128_000 }) } : { discard: true },
    trim: end ? { end: Math.min(end, await input.computeDuration()) } : undefined,
  });
  if (!conversion.isValid) throw new Error("Bu videoni brauzerda qayta ishlab bo'lmadi — MP4 (H.264) formatida eksport qiling");
  conversion.onProgress = onProgress;
  await conversion.execute();

  const bytes = output.target.buffer;
  if (!bytes) throw new Error("Videoni tayyorlab bo'lmadi");
  return { bytes, width: outWidth, height: outHeight };
}

export async function transcodeVideo(file: File, onProgress?: (ratio: number) => void): Promise<Transcoded> {
  // The full video is most of the work; the short preview the rest.
  const video = await encode(file, { ...VIDEO, audio: true }, (p) => onProgress?.(p * 0.8));
  const preview = await encode(file, { ...PREVIEW, audio: false, end: PREVIEW_SECONDS }, (p) => onProgress?.(0.8 + p * 0.2));
  const base = file.name.replace(/\.[^.]+$/, "");
  return {
    video: new File([video.bytes], `${base}.mp4`, { type: "video/mp4" }),
    preview: new File([preview.bytes], `${base}-preview.mp4`, { type: "video/mp4" }),
    width: video.width,
    height: video.height,
  };
}
