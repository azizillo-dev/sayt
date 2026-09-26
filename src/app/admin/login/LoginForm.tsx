"use client";

import { LogIn } from "lucide-react";
import { useActionState } from "react";
import { Button, Field, Input } from "@/components/admin/ui";
import { login } from "@/lib/admin/actions/auth";

export function LoginForm() {
  const [state, action, pending] = useActionState(login, null);

  return (
    <form action={action} className="mt-8 space-y-4 rounded-2xl border border-border bg-surface p-6">
      <Field label="Email">
        <Input name="email" type="email" autoComplete="username" required autoFocus />
      </Field>
      <Field label="Parol">
        <Input name="password" type="password" autoComplete="current-password" required />
      </Field>
      {state && !state.ok && (
        <p role="alert" className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {state.error}
        </p>
      )}
      <Button type="submit" variant="primary" loading={pending} icon={<LogIn className="size-4" />} className="w-full">
        Kirish
      </Button>
    </form>
  );
}
