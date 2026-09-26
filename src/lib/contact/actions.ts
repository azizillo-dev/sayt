"use server";

import { headers } from "next/headers";
import { after } from "next/server";
import { db, schema } from "@/db";
import { isLocale } from "@/lib/i18n/config";
import { notifyNewMessage } from "@/lib/notify";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { getSettings } from "@/lib/settings/service";
import { contactSchema, type ContactField, type ContactState } from "./schema";

/** Humans take longer than this to fill in three fields; bots do not. */
const MIN_FILL_MS = 2500;

export async function sendContactMessage(_prev: ContactState, form: FormData): Promise<ContactState> {
  // Spam traps: a hidden field only bots fill in, and an implausibly fast submit.
  // Bots get a fake success so they have no signal to adapt to.
  const startedAt = Number(form.get("startedAt"));
  if (form.get("company") || !startedAt || Date.now() - startedAt < MIN_FILL_MS) {
    return { status: "success" };
  }

  const parsed = contactSchema.safeParse({
    name: form.get("name"),
    contact: form.get("contact"),
    message: form.get("message"),
  });
  if (!parsed.success) {
    const fields: Partial<Record<ContactField, true>> = {};
    for (const issue of parsed.error.issues) fields[issue.path[0] as ContactField] = true;
    return { status: "invalid", fields };
  }

  const ip = clientIp(await headers());
  if (!rateLimit(`contact:${ip}`, 5, 60 * 60 * 1000)) return { status: "error", reason: "rateLimited" };

  const localeValue = form.get("locale");
  const locale = isLocale(localeValue) ? localeValue : "uz";

  try {
    const { name, contact, message } = parsed.data;
    await db.insert(schema.messages).values({ name, contact, body: message, locale, ip });

    // Deliver after the response is sent — the visitor never waits on SMTP.
    after(async () => notifyNewMessage(await getSettings(), { name, contact, body: message, locale }));
    return { status: "success" };
  } catch (error) {
    console.error("[contact]", error);
    return { status: "error", reason: "generic" };
  }
}
