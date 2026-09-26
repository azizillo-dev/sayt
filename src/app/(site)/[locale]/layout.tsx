import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { fontVariables } from "@/app/fonts";
import { CursorBubble } from "@/components/site/CursorBubble";
import { FloatingActions } from "@/components/site/FloatingActions";
import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { MotionProvider } from "@/components/site/MotionProvider";
import { SmoothScroll } from "@/components/site/SmoothScroll";
import { ThemeScript } from "@/components/site/ThemeScript";
import { buildNavigation, resolveLocale } from "@/lib/content/navigation";
import { getSocialLinks } from "@/lib/content/queries";
import { localeTags, locales } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getSettings } from "@/lib/settings/service";
import { themeToCss } from "@/lib/theme/css";
import "../../globals.css";

interface Props {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Omit<Props, "children">): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const settings = await getSettings();
  const siteUrl = process.env.SITE_URL ?? "http://localhost:3000";
  return {
    metadataBase: new URL(siteUrl),
    title: { default: settings.brand.name, template: `%s — ${settings.brand.name}` },
    description: settings.seo.description[locale] || settings.hero.subtitle[locale],
    openGraph: { siteName: settings.brand.name, locale: localeTags[locale], type: "website" },
    alternates: {
      languages: Object.fromEntries(locales.map((l) => [localeTags[l], `/${l}`])),
    },
  };
}

export async function generateViewport(): Promise<Viewport> {
  const { theme } = await getSettings();
  return {
    themeColor: [
      { media: "(prefers-color-scheme: light)", color: theme.light.background },
      { media: "(prefers-color-scheme: dark)", color: theme.dark.background },
    ],
  };
}

export default async function SiteLayout({ children, params }: Props) {
  const locale = await resolveLocale(params);
  const dict = getDictionary(locale);
  const [settings, socials] = await Promise.all([getSettings(), getSocialLinks()]);
  const nav = await buildNavigation(locale, settings, dict);

  return (
    <html lang={localeTags[locale]} className={fontVariables} suppressHydrationWarning>
      <head>
        <ThemeScript defaultMode={settings.theme.defaultMode} />
        <style dangerouslySetInnerHTML={{ __html: themeToCss(settings.theme) }} />
      </head>
      <body>
        <MotionProvider>
          <SmoothScroll />
          <Header
            locale={locale}
            brand={settings.brand.name}
            about={nav.about}
            more={nav.more}
            labels={{ more: dict.nav.more, language: dict.common.language }}
          />
          <main>{children}</main>
          <Footer
            brand={settings.brand.name}
            socials={socials}
            labels={{ follow: dict.sections.followMe, rights: dict.footer.rights }}
          />
          <FloatingActions labels={{ top: dict.common.scrollTop, theme: dict.common.toggleTheme }} />
          <CursorBubble />
        </MotionProvider>
      </body>
    </html>
  );
}
