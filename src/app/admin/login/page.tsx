import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAdmin } from "@/lib/auth/session";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Kirish" };

export default async function LoginPage() {
  if (await getAdmin()) redirect("/admin");

  return (
    <main className="grid min-h-dvh place-items-center px-5">
      <div className="w-full max-w-sm">
        <h1 className="text-center text-2xl font-bold tracking-tight">Admin panel</h1>
        <p className="mt-2 text-center text-sm text-muted">Davom etish uchun tizimga kiring</p>
        <LoginForm />
      </div>
    </main>
  );
}
