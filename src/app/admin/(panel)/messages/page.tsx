import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/ui";
import { listMessages } from "@/lib/admin/queries";
import { MessageList } from "./MessageList";

export const metadata: Metadata = { title: "Xabarlar" };

export default async function MessagesPage() {
  const messages = await listMessages();
  return (
    <>
      <PageHeader
        title="Xabarlar"
        description="Bog'lanish formasi orqali kelgan xabarlar. Ular Sozlamalardagi emailga ham yuboriladi."
      />
      <MessageList
        initial={messages.map((m) => ({
          id: m.id,
          name: m.name,
          contact: m.contact,
          body: m.body,
          locale: m.locale,
          isRead: m.isRead,
          createdAt: m.createdAt.toISOString(),
        }))}
      />
    </>
  );
}
