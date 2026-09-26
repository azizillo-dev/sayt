"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { defaultLocale, isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";

export default function NotFound() {
  const params = useParams<{ locale?: string }>();
  const locale = isLocale(params.locale) ? params.locale : defaultLocale;
  const dict = getDictionary(locale).notFound;

  return (
    <section className="mx-auto flex min-h-[80svh] max-w-3xl flex-col items-center justify-center px-5 text-center">
      <p className="animate-rise font-display text-[clamp(6rem,22vw,13rem)] font-bold leading-none tracking-tighter text-accent">
        404
      </p>
      <h1 className="animate-rise mt-4 font-display text-3xl font-bold sm:text-4xl" style={{ animationDelay: "0.08s" }}>
        {dict.title}
      </h1>
      <p className="animate-rise mt-4 text-lg text-muted" style={{ animationDelay: "0.14s" }}>
        {dict.text}
      </p>
      <Link
        href={`/${locale}`}
        className="animate-rise mt-10 rounded-full bg-fg px-7 py-3.5 font-semibold text-bg transition-transform duration-300 hover:scale-[1.03]"
        style={{ animationDelay: "0.2s" }}
      >
        {dict.home}
      </Link>
    </section>
  );
}
