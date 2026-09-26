import { ZodError } from "zod";

/** Uniform return type for admin server actions. */
export type ActionResult<T = undefined> = { ok: true; data: T; warning?: string } | { ok: false; error: string };

export function ok<T>(data: T, warning?: string): ActionResult<T> {
  return { ok: true, data, ...(warning ? { warning } : {}) };
}

export function fail(error: string): ActionResult<never> {
  return { ok: false, error };
}

export class UserError extends Error {}

/** Runs an action body, turning thrown UserErrors into friendly results and logging the rest. */
export async function run<T>(body: () => Promise<ActionResult<T>>): Promise<ActionResult<T>> {
  try {
    return await body();
  } catch (error) {
    // Framework control flow (redirect/notFound) must propagate.
    if (error instanceof Error && "digest" in error) throw error;
    if (error instanceof UserError) return fail(error.message);
    if (error instanceof ZodError) {
      const issue = error.issues[0];
      return fail(issue ? `${issue.path.join(".")}: ${issue.message}` : "Ma'lumotlar noto'g'ri");
    }
    console.error("[admin action]", error);
    return fail("Kutilmagan xatolik yuz berdi. Qayta urinib ko'ring.");
  }
}
