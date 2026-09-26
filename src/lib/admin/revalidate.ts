import "server-only";
import { revalidatePath } from "next/cache";

/**
 * Public pages are statically rendered and cached. Any admin change
 * purges the whole site cache — it is small, and this guarantees no page
 * ever shows stale navigation, footer links or theme.
 */
export function revalidateSite() {
  revalidatePath("/", "layout");
}
