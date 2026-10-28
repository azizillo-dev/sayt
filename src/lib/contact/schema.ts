import { z } from "zod";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE = /^\+?[\d\s()-]{7,20}$/;
/** "@user", "user", "t.me/user" or "https://t.me/user" — Telegram allows 5–32 of [a-z0-9_]. */
const TELEGRAM = /^(?:https?:\/\/)?(?:t\.me\/|@)?[a-z][a-z0-9_]{4,31}$/i;

/** Error messages are dictionary keys, translated in the form. */
export const contactSchema = z.object({
  name: z.string().trim().min(2, "name").max(100, "name"),
  contact: z
    .string()
    .trim()
    .max(120, "contact")
    // Telegram or phone is what the form asks for; e-mail still works for those who type one.
    .refine((v) => TELEGRAM.test(v) || EMAIL.test(v) || (PHONE.test(v) && v.replace(/\D/g, "").length >= 7), "contact"),
  message: z.string().trim().min(10, "message").max(5000, "message"),
});

export type ContactField = keyof z.infer<typeof contactSchema>;

export type ContactState =
  | { status: "idle" }
  | { status: "success" }
  | { status: "invalid"; fields: Partial<Record<ContactField, true>> }
  | { status: "error"; reason: "rateLimited" | "generic" };
