import { z } from "zod";
import { defaultTheme, hexColor, themeSchema } from "@/lib/theme/schema";

/** A string in every site language. `uz` is the source; others are translated. */
export const localizedSchema = z.object({
  uz: z.string().max(2000).default(""),
  ru: z.string().max(2000).default(""),
  en: z.string().max(2000).default(""),
});
export type Localized = z.infer<typeof localizedSchema>;

const localized = (uz = "", ru = "", en = "") => localizedSchema.default({ uz, ru, en });

/** One fact column of the profile hero: a heading and its lines ("items", one per line). */
export const heroColumnSchema = z.object({
  title: localized(),
  items: localized(),
});
export type HeroColumn = z.infer<typeof heroColumnSchema>;

/**
 * All site-wide settings live in a single JSON document. Each group has
 * defaults, so adding a new option never requires a data migration —
 * old documents are simply filled in on parse.
 */
export const settingsSchema = z.object({
  brand: z
    .object({
      name: z.string().min(1).max(60).default("Rustam's I/O"),
    })
    .prefault({}),

  hero: z
    .object({
      /**
       * `profile` — the designer's card: portrait, fact columns, gradient.
       * `minimal` — one large headline. Both are complete; the admin picks.
       */
      layout: z.enum(["profile", "minimal"]).default("profile"),

      available: z.boolean().default(true),
      availableText: localized("Yangi loyihalarga ochiqman", "Открыт для новых проектов", "Available for new projects"),

      // ── minimal layout ──
      title: localized(
        "Brendlar uchun vizual hikoyalar yarataman",
        "Создаю визуальные истории для брендов",
        "I craft visual stories for brands",
      ),
      subtitle: localized(
        "Grafik dizayner — brending, logotip va poligrafiya.",
        "Графический дизайнер — брендинг, логотипы и полиграфия.",
        "Graphic designer — branding, logos and print.",
      ),

      // ── profile layout ──
      /** Empty falls back to the brand name. */
      name: localized(),
      role: localized(),
      /** Cut-out portrait; without it the text simply uses the full width. */
      photoId: z.uuid().nullable().default(null),
      /** Softens the photo's edge into the gradient — needed for rectangular photos. */
      photoBlend: z.boolean().default(true),
      columns: z.array(heroColumnSchema).max(4).default([]),
      tagline: localized(),
      gradient: z
        .object({
          from: hexColor.default("#0c1c37"),
          via: hexColor.default("#6b6580"),
          to: hexColor.default("#e8c09a"),
          /** Colour of the role line and the column headings. */
          label: hexColor.default("#f2b877"),
        })
        .prefault({}),
    })
    .prefault({}),

  projects: z
    .object({
      /** When on, every project is listed on the home page and /projects is hidden. */
      showAllOnHome: z.boolean().default(false),
      featuredLimit: z.number().int().min(1).max(50).default(10),
    })
    .prefault({}),

  partners: z
    .object({
      enabled: z.boolean().default(true),
      /** How many logos travel in the home-page marquee. */
      marqueeCount: z.number().int().min(3).max(40).default(12),
      /** Scroll speed in pixels per second. */
      speed: z.number().int().min(10).max(300).default(60),
      direction: z.enum(["left", "right"]).default("left"),
      pauseOnHover: z.boolean().default(false),
      /** Mute logos to grey until hovered. Off by default — brand colours read better. */
      grayscale: z.boolean().default(false),
      /** Invert logo colours in dark mode, so black logos stay visible. */
      invertOnDark: z.boolean().default(false),
    })
    .prefault({}),

  contact: z
    .object({
      /** Inbox that receives contact-form messages. */
      email: z.union([z.email(), z.literal("")]).default(""),
      title: localized("Birga ishlaymizmi?", "Поработаем вместе?", "Let's work together"),
      subtitle: localized(
        "Loyihangiz haqida yozing — 24 soat ichida javob beraman.",
        "Расскажите о проекте — отвечу в течение 24 часов.",
        "Tell me about your project — I reply within 24 hours.",
      ),
      telegramBotToken: z.string().max(200).default(""),
      telegramChatId: z.string().max(100).default(""),
    })
    .prefault({}),

  seo: z
    .object({
      description: localized(),
    })
    .prefault({}),

  theme: themeSchema.default(defaultTheme),
});

export type SiteSettings = z.infer<typeof settingsSchema>;

export const defaultSettings: SiteSettings = settingsSchema.parse({});
