import "server-only";
import sharp, { type Sharp } from "sharp";
import type { ImageFormat, MediaVariant } from "./types";

/** Breakpoints for responsive `srcset`. 3840 covers 4K / retina full-bleed. */
const TARGET_WIDTHS = [640, 1024, 1600, 2400, 3840];
const PLACEHOLDER_WIDTH = 24;

export interface ProcessedImage {
  width: number;
  height: number;
  placeholder: string | null;
  dominantColor: string | null;
  variants: (MediaVariant & { body: Buffer })[];
}

interface Options {
  /** Keep every pixel — for pixel art, UI mockups, type specimens. */
  lossless?: boolean;
}

function encode(pipeline: Sharp, format: ImageFormat, lossless: boolean): Sharp {
  if (format === "avif") {
    return pipeline.avif(
      lossless
        ? { lossless: true }
        : {
            quality: 64,
            // 4:4:4 keeps thin type and flat brand colours crisp — 4:2:0 smears them.
            chromaSubsampling: "4:4:4",
            // Measured on one CPU, as a serverless function gets, for a 6000×4000
            // export: effort 4 took 14 s (111 s for a grainy photo, past the
            // 60 s limit); effort 3 takes 6 s (32 s) for files ~3% larger.
            // Effort only changes how hard the encoder searches, not the quality target.
            effort: 3,
          },
    );
  }
  return pipeline.webp(lossless ? { lossless: true } : { quality: 86, effort: 4, smartSubsample: true });
}

function widthsFor(original: number): number[] {
  const widths = TARGET_WIDTHS.filter((w) => w < original);
  widths.push(Math.min(original, TARGET_WIDTHS.at(-1)!));
  return [...new Set(widths)];
}

function toHex({ r, g, b }: { r: number; g: number; b: number }): string {
  return `#${[r, g, b].map((c) => c.toString(16).padStart(2, "0")).join("")}`;
}

/**
 * Turns an uploaded raster image into AVIF + WebP variants at several widths.
 *
 * - EXIF orientation is applied, so phone photos are never sideways.
 * - Everything is converted to sRGB. Designers often export Adobe RGB or CMYK,
 *   which browsers otherwise render washed-out or with wrong colours.
 * - Animated GIF/WebP stay animated (as animated WebP).
 */
export async function processImage(input: Buffer, { lossless = false }: Options = {}): Promise<ProcessedImage> {
  const meta = await sharp(input).metadata();
  const animated = (meta.pages ?? 1) > 1;

  const base = sharp(input, { animated, limitInputPixels: 24_000 * 24_000 })
    .autoOrient()
    .toColourspace("srgb");

  // `autoOrient` dimensions already account for EXIF rotation; animated
  // images report the full frame strip, so use a single frame's height.
  const width = meta.autoOrient.width;
  const height = animated ? (meta.pageHeight ?? meta.autoOrient.height) : meta.autoOrient.height;

  const formats: ImageFormat[] = animated ? ["webp"] : ["avif", "webp"];
  const variants: ProcessedImage["variants"] = [];

  // Sequential on purpose: a 50-megapixel image decoded 10× in parallel
  // would exhaust memory on a small server.
  for (const w of widthsFor(width)) {
    for (const format of formats) {
      const { data, info } = await encode(base.clone().resize({ width: w, withoutEnlargement: true }), format, lossless)
        .toBuffer({ resolveWithObject: true });
      variants.push({
        format,
        width: info.width,
        height: animated ? Math.round((info.width / width) * height) : info.height,
        key: "",
        body: data,
      });
    }
  }

  const [placeholder, stats] = await Promise.all([
    sharp(input, { animated: false })
      .autoOrient()
      .toColourspace("srgb")
      .resize({ width: PLACEHOLDER_WIDTH })
      .webp({ quality: 40 })
      .toBuffer()
      .then((b) => `data:image/webp;base64,${b.toString("base64")}`),
    sharp(input, { animated: false }).stats(),
  ]);

  return { width, height, placeholder, dominantColor: toHex(stats.dominant), variants };
}

/** Width/height of an SVG, falling back to a square when it only has a viewBox. */
export async function svgDimensions(input: Buffer): Promise<{ width: number; height: number }> {
  const meta = await sharp(input).metadata();
  return { width: meta.width ?? 512, height: meta.height ?? 512 };
}

const UNSAFE_SVG = /<script|<foreignObject|\son[a-z]+\s*=|javascript:|<iframe|<embed|<object/i;

/** SVGs are served as-is, so anything executable is rejected outright. */
export function isSafeSvg(input: Buffer): boolean {
  return !UNSAFE_SVG.test(input.toString("utf8"));
}
