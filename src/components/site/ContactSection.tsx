import { Reveal } from "@/components/motion/Reveal";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { ContactForm } from "./ContactForm";

interface Props {
  locale: Locale;
  title: string;
  subtitle: string;
  dict: Dictionary;
}

export function ContactSection({ locale, title, subtitle, dict }: Props) {
  return (
    <section id="contact" className="mx-auto max-w-5xl scroll-mt-24 px-5 py-16 sm:px-8 sm:py-24">
      <div className="grid gap-8 rounded-card border border-border bg-surface p-5 sm:p-8 lg:grid-cols-[1fr_1.15fr] lg:gap-12 lg:p-10">
        <Reveal>
          <h2 className="font-display text-3xl font-bold leading-[1.05] tracking-tight sm:text-4xl">{title}</h2>
          {subtitle && <p className="mt-3 max-w-sm leading-relaxed text-muted">{subtitle}</p>}
        </Reveal>
        <Reveal delay={0.1}>
          <ContactForm locale={locale} dict={dict.contact} />
        </Reveal>
      </div>
    </section>
  );
}
