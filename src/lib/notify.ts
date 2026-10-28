import "server-only";
import nodemailer, { type SendMailOptions } from "nodemailer";
import type { SiteSettings } from "@/lib/settings/schema";

export interface ContactMessage {
  name: string;
  contact: string;
  body: string;
  locale: string;
}

type MailSettings = Pick<SiteSettings["contact"], "smtpUser" | "smtpPassword" | "smtpHost" | "smtpPort">;

interface SmtpAccount {
  host: string;
  port: number;
  user: string;
  pass: string;
  from: string | undefined;
}

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

function isEmail(value: string) {
  return value.includes("@");
}

/** The mailbox set in the admin panel; the SMTP_* environment variables are the fallback. */
function smtpAccount(mail: MailSettings): SmtpAccount | null {
  if (mail.smtpUser && mail.smtpPassword) {
    return {
      host: mail.smtpHost || "smtp.gmail.com",
      port: mail.smtpPort,
      user: mail.smtpUser,
      // Google shows app passwords in groups of four; the spaces are not part of it.
      pass: mail.smtpPassword.replace(/\s+/g, ""),
      from: undefined,
    };
  }
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SMTP_FROM } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASSWORD) return null;
  return { host: SMTP_HOST, port: Number(SMTP_PORT ?? 465), user: SMTP_USER, pass: SMTP_PASSWORD, from: SMTP_FROM || undefined };
}

export function isMailConfigured(mail: MailSettings): boolean {
  return smtpAccount(mail) !== null;
}

async function deliver(account: SmtpAccount, brand: string, mail: SendMailOptions) {
  const transport = nodemailer.createTransport({
    host: account.host,
    port: account.port,
    secure: account.port === 465,
    auth: { user: account.user, pass: account.pass },
    connectionTimeout: 10_000,
  });
  await transport.sendMail({ from: account.from ?? { name: brand, address: account.user }, ...mail });
}

async function sendEmail(to: string, brand: string, mail: MailSettings, msg: ContactMessage) {
  const account = smtpAccount(mail);
  if (!account) {
    console.warn("[notify] SMTP is not configured — message saved to the admin inbox only");
    return;
  }
  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:560px;margin:auto;padding:24px;color:#141414">
      <h2 style="margin:0 0 16px">Yangi xabar — ${escapeHtml(brand)}</h2>
      <table style="border-collapse:collapse;width:100%;font-size:15px">
        <tr><td style="padding:6px 0;color:#666;width:120px">Ism</td><td><b>${escapeHtml(msg.name)}</b></td></tr>
        <tr><td style="padding:6px 0;color:#666">Aloqa</td><td>${escapeHtml(msg.contact)}</td></tr>
        <tr><td style="padding:6px 0;color:#666">Til</td><td>${msg.locale.toUpperCase()}</td></tr>
      </table>
      <div style="margin-top:16px;padding:16px;background:#f5f5f3;border-radius:12px;white-space:pre-wrap;line-height:1.6">${escapeHtml(msg.body)}</div>
    </div>`;

  await deliver(account, brand, {
    to,
    subject: `Saytdan yangi xabar: ${msg.name}`,
    text: `${msg.name}\n${msg.contact}\n\n${msg.body}`,
    html,
    // "Reply" in the mail client goes straight to the visitor.
    ...(isEmail(msg.contact) ? { replyTo: msg.contact } : {}),
  });
}

/** Lets the admin check the mailbox settings before a real message depends on them. */
export async function sendTestEmail(mail: MailSettings, brand: string, to: string) {
  const account = smtpAccount(mail);
  if (!account) throw new Error("SMTP is not configured");
  await deliver(account, brand, {
    to,
    subject: `Sinov xati — ${brand}`,
    text: "Pochta to'g'ri sozlangan: saytdagi formadan yozilgan xabarlar shu manzilga keladi.",
  });
}

/** Turns a nodemailer failure into something the admin can act on. */
export function describeMailError(error: unknown): string {
  const code = (error as { code?: string } | null)?.code;
  if (code === "EAUTH") return "Pochta login yoki parolni qabul qilmadi. Gmail uchun oddiy parol emas, 16 xonali ilova parolini kiriting.";
  if (code === "ESOCKET" || code === "ETIMEDOUT" || code === "ECONNECTION" || code === "EDNS") {
    return "Pochta serveriga ulanib bo'lmadi — server manzili va portni tekshiring.";
  }
  const message = error instanceof Error ? error.message : String(error);
  return `Xat yuborilmadi: ${message.slice(0, 160)}`;
}

async function sendTelegram(token: string, chatId: string, msg: ContactMessage) {
  const text = `📩 <b>Yangi xabar</b>\n\n<b>${escapeHtml(msg.name)}</b>\n${escapeHtml(msg.contact)}\n\n${escapeHtml(msg.body)}`;
  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error(`Telegram ${res.status}: ${await res.text()}`);
}

/** Fans a contact message out to e-mail and Telegram. Failures are logged, never thrown. */
export async function notifyNewMessage(settings: SiteSettings, msg: ContactMessage) {
  const { email, telegramBotToken, telegramChatId } = settings.contact;
  const jobs: Promise<unknown>[] = [];
  if (email) jobs.push(sendEmail(email, settings.brand.name, settings.contact, msg));
  if (telegramBotToken && telegramChatId) jobs.push(sendTelegram(telegramBotToken, telegramChatId, msg));

  const results = await Promise.allSettled(jobs);
  for (const r of results) if (r.status === "rejected") console.error("[notify]", r.reason);
}
