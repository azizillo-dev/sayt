"use client";

import { Mail, MailOpen, Phone, Reply, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useToast } from "@/components/admin/Toaster";
import { buttonClass, EmptyState, IconButton } from "@/components/admin/ui";
import { deleteMessage, setMessageRead } from "@/lib/admin/actions/messages";
import { cn } from "@/lib/cn";

export interface MessageRow {
  id: string;
  name: string;
  contact: string;
  body: string;
  locale: string;
  isRead: boolean;
  createdAt: string;
}

const dateFormat = new Intl.DateTimeFormat("ru-RU", { dateStyle: "short", timeStyle: "short" });

function replyHref(contact: string) {
  return contact.includes("@") ? `mailto:${contact}` : `tel:${contact.replace(/[^\d+]/g, "")}`;
}

export function MessageList({ initial }: { initial: MessageRow[] }) {
  const toast = useToast();
  const router = useRouter();
  const [messages, setMessages] = useState(initial);
  const [openId, setOpenId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const markRead = (message: MessageRow, isRead: boolean) => {
    setMessages((all) => all.map((m) => (m.id === message.id ? { ...m, isRead } : m)));
    startTransition(async () => {
      const result = await setMessageRead(message.id, isRead);
      if (!result.ok) toast.show(result.error, "error");
      router.refresh(); // updates the unread badge in the sidebar
    });
  };

  const open = (message: MessageRow) => {
    setOpenId(openId === message.id ? null : message.id);
    if (!message.isRead) markRead(message, true);
  };

  const remove = (message: MessageRow) => {
    if (!window.confirm(`${message.name} xabarini o'chirasizmi?`)) return;
    startTransition(async () => {
      const result = await deleteMessage(message.id);
      if (toast.result(result, "Xabar o'chirildi")) {
        setMessages((all) => all.filter((m) => m.id !== message.id));
        router.refresh();
      }
    });
  };

  if (messages.length === 0) {
    return <EmptyState icon={<Mail className="size-6" />} title="Hozircha xabar yo'q" />;
  }

  return (
    <ul className="space-y-2">
      {messages.map((m) => {
        const expanded = openId === m.id;
        const isEmail = m.contact.includes("@");
        return (
          <li key={m.id} className={cn("rounded-2xl border bg-surface transition-colors", m.isRead ? "border-border" : "border-accent/40")}>
            <button type="button" onClick={() => open(m)} className="flex w-full items-start gap-4 p-4 text-left sm:p-5">
              <span className={cn("mt-2 size-2 shrink-0 rounded-full", m.isRead ? "bg-transparent" : "bg-accent")} />
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-baseline justify-between gap-x-4">
                  <span className={cn("font-semibold", !m.isRead && "text-fg")}>{m.name}</span>
                  <time className="text-xs text-muted">{dateFormat.format(new Date(m.createdAt))}</time>
                </span>
                <span className="block text-sm text-muted">
                  {m.contact} · {m.locale.toUpperCase()}
                </span>
                <span className={cn("mt-2 block text-sm leading-relaxed", expanded ? "whitespace-pre-wrap" : "line-clamp-2")}>{m.body}</span>
              </span>
            </button>

            {expanded && (
              <div className="flex flex-wrap items-center gap-2 border-t border-border px-4 py-3 sm:px-5">
                <a href={replyHref(m.contact)} className={buttonClass("primary", "sm")}>
                  {isEmail ? <Reply className="size-4" /> : <Phone className="size-4" />}
                  {isEmail ? "Javob yozish" : "Qo'ng'iroq qilish"}
                </a>
                <span className="flex-1" />
                <IconButton label={m.isRead ? "O'qilmagan deb belgilash" : "O'qilgan deb belgilash"} onClick={() => markRead(m, !m.isRead)}>
                  {m.isRead ? <Mail className="size-4" /> : <MailOpen className="size-4" />}
                </IconButton>
                <IconButton label="O'chirish" onClick={() => remove(m)} className="hover:text-red-400">
                  <Trash2 className="size-4" />
                </IconButton>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
