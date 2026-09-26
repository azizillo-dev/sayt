import "server-only";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { db, schema } from "@/db";
import { SESSION_COOKIE, SESSION_TTL_SECONDS, signSession, verifySession } from "./token";

export async function createSession(admin: { id: string; sessionVersion: number }) {
  const token = await signSession({ sub: admin.id, ver: admin.sessionVersion });
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function destroySession() {
  (await cookies()).delete(SESSION_COOKIE);
}

/** The signed-in admin, or null. Memoised per request. */
export const getAdmin = cache(async () => {
  const session = await verifySession((await cookies()).get(SESSION_COOKIE)?.value);
  if (!session) return null;

  const admin = await db.query.admins.findFirst({
    where: eq(schema.admins.id, session.sub),
    columns: { id: true, email: true, sessionVersion: true },
  });
  // A password change bumps sessionVersion and logs out every other device.
  return admin && admin.sessionVersion === session.ver ? admin : null;
});

/** Guard for admin pages, server actions and route handlers. */
export async function requireAdmin() {
  const admin = await getAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}
