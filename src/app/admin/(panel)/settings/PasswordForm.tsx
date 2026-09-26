"use client";

import { KeyRound } from "lucide-react";
import { useState, useTransition } from "react";
import { useToast } from "@/components/admin/Toaster";
import { Button, Card, Field, Input } from "@/components/admin/ui";
import { changePassword } from "@/lib/admin/actions/auth";

const empty = { current: "", next: "", confirm: "" };

export function PasswordForm() {
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState(empty);

  const submit = () =>
    startTransition(async () => {
      const result = await changePassword(form);
      if (toast.result(result, "Parol almashtirildi. Boshqa qurilmalardagi sessiyalar yopildi.")) setForm(empty);
    });

  return (
    <Card title="Parolni almashtirish" description="Kamida 10 ta belgi. Almashtirilgach, boshqa qurilmalar tizimdan chiqariladi.">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="grid gap-4 sm:grid-cols-3"
      >
        <Field label="Joriy parol">
          <Input type="password" autoComplete="current-password" value={form.current} onChange={(e) => setForm({ ...form, current: e.target.value })} />
        </Field>
        <Field label="Yangi parol">
          <Input type="password" autoComplete="new-password" value={form.next} onChange={(e) => setForm({ ...form, next: e.target.value })} />
        </Field>
        <Field label="Yangi parol (takror)">
          <Input type="password" autoComplete="new-password" value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} />
        </Field>
        <div className="sm:col-span-3">
          <Button type="submit" loading={pending} disabled={!form.current || !form.next} icon={<KeyRound className="size-4" />}>
            Parolni almashtirish
          </Button>
        </div>
      </form>
    </Card>
  );
}
