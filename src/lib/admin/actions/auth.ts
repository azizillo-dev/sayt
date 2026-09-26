"use server";

import bcrypt from "bcryptjs";
import { eq, sql } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db, schema } from "@/db";
import { createSession, destroySession, requireAdmin } from "@/lib/auth/session";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { type ActionResult, fail, ok, run, UserError } from "../result";

const LOGIN_ATTEMPTS = 8;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
// Compared against when the e-mail is unknown, so timing does not reveal which e-mails exist.
const DUMMY_HASH = "$2b$12$C6UzMDM.H6dfI/f/IKcEeO5dW5r3pQ8R7hQ1rXnZ6lVvYxjX0nK7a";

export async function login(_prev: ActionResult | null, form: FormData): Promise<ActionResult> {
  const ip = clientIp(await headers());
  if (!rateLimit(`login:${ip}`, LOGIN_ATTEMPTS, LOGIN_WINDOW_MS)) {
    return fail("Juda ko'p urinish. 15 daqiqadan keyin qayta urinib ko'ring.");
  }

  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");

  const admin = await db.query.admins.findFirst({ where: eq(schema.admins.email, email) });
  const valid = await bcrypt.compare(password, admin?.passwordHash ?? DUMMY_HASH);
  if (!admin || !valid) return fail("Email yoki parol noto'g'ri");

  await createSession(admin);
  redirect("/admin");
}

export async function logout() {
  await destroySession();
  redirect("/admin/login");
}

const passwordSchema = z
  .object({
    current: z.string().min(1),
    next: z.string().min(10, "Yangi parol kamida 10 ta belgidan iborat bo'lsin").max(200),
    confirm: z.string(),
  })
  .refine((v) => v.next === v.confirm, { message: "Parollar mos kelmadi", path: ["confirm"] });

/** Changes the password and signs out every other device (sessionVersion bump). */
export async function changePassword(input: z.infer<typeof passwordSchema>): Promise<ActionResult> {
  const { id } = await requireAdmin();
  return run(async () => {
    const data = passwordSchema.parse(input);
    const admin = await db.query.admins.findFirst({ where: eq(schema.admins.id, id) });
    if (!admin || !(await bcrypt.compare(data.current, admin.passwordHash))) {
      throw new UserError("Joriy parol noto'g'ri");
    }

    const [updated] = await db
      .update(schema.admins)
      .set({
        passwordHash: await bcrypt.hash(data.next, 12),
        sessionVersion: sql`${schema.admins.sessionVersion} + 1`,
      })
      .where(eq(schema.admins.id, id))
      .returning();
    await createSession(updated!);
    return ok(undefined);
  });
}
