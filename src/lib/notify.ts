import "server-only";
import nodemailer from "nodemailer";
import type { SiteSettings } from "@/lib/settings/schema";

export interface ContactMessage {
  name: string;
  contact: string;
  body: string;
  locale: string;
}

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

function isEmail(value: string) {
  return value.includes("@");
}

function smtpTransport() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASSWORD) return null;
  const port = Number(SMTP_PORT ?? 465);
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port,
    secure: port === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASSWORD },
  });
}

async function sendEmail(to: string, brand: string, msg: ContactMessage) {
  const transport = smtpTransport();
  if (!transport) {
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

  await transport.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject: `Saytdan yangi xabar: ${msg.name}`,
    text: `${msg.name}\n${msg.contact}\n\n${msg.body}`,
    html,
    // "Reply" in the mail client goes straight to the visitor.
    ...(isEmail(msg.contact) ? { replyTo: msg.contact } : {}),
  });
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
  if (email) jobs.push(sendEmail(email, settings.brand.name, msg));
  if (telegramBotToken && telegramChatId) jobs.push(sendTelegram(telegramBotToken, telegramChatId, msg));

  const results = await Promise.allSettled(jobs);
  for (const r of results) if (r.status === "rejected") console.error("[notify]", r.reason);
}
