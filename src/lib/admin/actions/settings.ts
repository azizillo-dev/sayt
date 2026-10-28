"use server";

import { autoTranslateBundle } from "@/lib/content/localize";
import { requireAdmin } from "@/lib/auth/session";
import { settingsSchema, type Localized, type SiteSettings } from "@/lib/settings/schema";
import { getSettings, saveSettings } from "@/lib/settings/service";
import { defaultTheme, themeSchema, type Theme } from "@/lib/theme/schema";
import { describeMailError, isMailConfigured, sendTestEmail } from "@/lib/notify";
import { type ActionResult, ok, run, UserError } from "../result";
import { revalidateSite } from "../revalidate";

type GeneralSettings = Pick<SiteSettings, "brand" | "hero" | "projects" | "contact" | "seo">;

const generalSchema = settingsSchema.pick({ brand: true, hero: true, projects: true, contact: true, seo: true });

/** A person's name is spelled, not translated — it is only copied where missing. */
function spreadName(value: Localized, force: boolean): Localized {
  const fill = (current: string) => (!force && current.trim() ? current : value.uz);
  return { uz: value.uz, ru: fill(value.ru), en: fill(value.en) };
}

/** Saves the "Sozlamalar" page; translatable texts are filled from Uzbek. */
export async function saveGeneralSettings(
  input: GeneralSettings,
  retranslate: boolean,
): Promise<ActionResult<GeneralSettings>> {
  await requireAdmin();
  return run(async () => {
    const data = generalSchema.parse(input);

    // Every translatable string of the form travels in one bundle, including
    // the hero columns, which are flattened into `col0.title`, `col0.items`, …
    const bundle: Record<string, Localized> = {
      heroTitle: data.hero.title,
      heroSubtitle: data.hero.subtitle,
      heroAvailable: data.hero.availableText,
      heroRole: data.hero.role,
      heroTagline: data.hero.tagline,
      contactTitle: data.contact.title,
      contactSubtitle: data.contact.subtitle,
      seoDescription: data.seo.description,
    };
    data.hero.columns.forEach((column, i) => {
      bundle[`col${i}.title`] = column.title;
      bundle[`col${i}.items`] = column.items;
    });

    const translated = await autoTranslateBundle(bundle, retranslate);
    /** Every key put into the bundle comes back out of it. */
    const t = (key: string): Localized => translated[key]!;

    const general: GeneralSettings = {
      ...data,
      hero: {
        ...data.hero,
        title: t("heroTitle"),
        subtitle: t("heroSubtitle"),
        availableText: t("heroAvailable"),
        name: spreadName(data.hero.name, retranslate),
        role: t("heroRole"),
        tagline: t("heroTagline"),
        columns: data.hero.columns.map((_, i) => ({ title: t(`col${i}.title`), items: t(`col${i}.items`) })),
      },
      contact: { ...data.contact, title: t("contactTitle"), subtitle: t("contactSubtitle") },
      seo: { description: t("seoDescription") },
    };

    await saveSettings({ ...(await getSettings()), ...general });
    revalidateSite();
    return ok(general);
  });
}

/**
 * Sends a test letter with the mailbox settings as typed — before saving, so
 * a wrong password shows up here rather than as a silently lost message.
 */
export async function sendTestMail(contact: SiteSettings["contact"]): Promise<ActionResult<{ to: string }>> {
  await requireAdmin();
  return run(async () => {
    const data = settingsSchema.shape.contact.parse(contact);
    const to = data.email || data.smtpUser;
    if (!to) throw new UserError("Avval xabarlar keladigan emailni kiriting");
    if (!isMailConfigured(data)) throw new UserError("Yuboruvchi pochta manzili va ilova parolini kiriting");
    try {
      await sendTestEmail(data, (await getSettings()).brand.name, to);
    } catch (error) {
      throw new UserError(describeMailError(error));
    }
    return ok({ to });
  });
}

/** The "50+" card; texts are filled from Uzbek like the rest of the settings. */
export async function saveClientsSettings(
  input: SiteSettings["clients"],
  retranslate: boolean,
): Promise<ActionResult<SiteSettings["clients"]>> {
  await requireAdmin();
  return run(async () => {
    const data = settingsSchema.shape.clients.parse(input);
    const t = await autoTranslateBundle({ title: data.title, text: data.text, moreLabel: data.moreLabel }, retranslate);
    const clients = { ...data, title: t.title, text: t.text, moreLabel: t.moreLabel };
    await saveSettings({ ...(await getSettings()), clients });
    revalidateSite();
    return ok(clients);
  });
}

/** The "DIZAYN" statement; texts are filled from Uzbek like the rest. */
export async function saveStatementSettings(
  input: SiteSettings["statement"],
  retranslate: boolean,
): Promise<ActionResult<SiteSettings["statement"]>> {
  await requireAdmin();
  return run(async () => {
    const data = settingsSchema.shape.statement.parse(input);
    const t = await autoTranslateBundle({ word: data.word, headline: data.headline, text: data.text, steps: data.steps }, retranslate);
    const statement = { ...data, word: t.word, headline: t.headline, text: t.text, steps: t.steps };
    await saveSettings({ ...(await getSettings()), statement });
    revalidateSite();
    return ok(statement);
  });
}

export async function savePartnerSettings(input: SiteSettings["partners"]): Promise<ActionResult> {
  await requireAdmin();
  return run(async () => {
    const partners = settingsSchema.shape.partners.parse(input);
    await saveSettings({ ...(await getSettings()), partners });
    revalidateSite();
    return ok(undefined);
  });
}

export async function saveTheme(input: Theme): Promise<ActionResult<Theme>> {
  await requireAdmin();
  return run(async () => {
    const theme = themeSchema.parse(input);
    await saveSettings({ ...(await getSettings()), theme });
    revalidateSite();
    return ok(theme);
  });
}

export async function resetTheme(): Promise<ActionResult<Theme>> {
  return saveTheme(defaultTheme);
}
