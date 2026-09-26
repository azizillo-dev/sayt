import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BlockRenderer } from "@/components/blocks/BlockRenderer";
import { Picture } from "@/components/media/Picture";
import { Reveal } from "@/components/motion/Reveal";
import { BackLink } from "@/components/site/BackLink";
import { resolveLocale } from "@/lib/content/navigation";
import { getProject, getProjectSlugs } from "@/lib/content/queries";
import { formatDate } from "@/lib/i18n/format";
import { COVER_MAX_H } from "@/lib/media/fit";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getSettings } from "@/lib/settings/service";

type Props = { params: Promise<{ locale: string; slug: string }> };

export async function generateStaticParams() {
  return (await getProjectSlugs()).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const project = await getProject(locale, (await params).slug);
  if (!project) return {};
  return {
    title: project.title,
    description: project.excerpt,
    openGraph: {
      title: project.title,
      description: project.excerpt,
      images: project.cover ? [{ url: project.cover.url, width: project.cover.width, height: project.cover.height }] : [],
    },
  };
}

export default async function ProjectPage({ params }: Props) {
  const locale = await resolveLocale(params);
  const { slug } = await params;
  const [project, settings] = await Promise.all([getProject(locale, slug), getSettings()]);
  if (!project) notFound();

  const dict = getDictionary(locale);
  const backHref = settings.projects.showAllOnHome ? `/${locale}#work` : `/${locale}/projects`;

  return (
    <article className="pb-24 pt-[calc(var(--header-h)+2.5rem)] sm:pb-32 sm:pt-[calc(var(--header-h)+4rem)]">
      <header className="mx-auto max-w-5xl px-5 sm:px-8">
        <div className="animate-rise">
          <BackLink fallback={backHref} label={dict.common.back} home={{ href: `/${locale}`, label: dict.nav.home }} />
        </div>
        <h1
          className="animate-rise mt-8 font-display text-[clamp(2.25rem,6vw,4.75rem)] font-bold leading-[1.02] tracking-[-0.03em]"
          style={{ animationDelay: "0.05s" }}
        >
          {project.title}
        </h1>
        {project.excerpt && (
          <p
            className="animate-rise mt-6 max-w-3xl text-lg leading-relaxed text-muted sm:text-xl"
            style={{ animationDelay: "0.12s" }}
          >
            {project.excerpt}
          </p>
        )}
        <time
          dateTime={project.date}
          className="animate-rise mt-6 block text-sm text-muted"
          style={{ animationDelay: "0.18s" }}
        >
          {formatDate(project.date, locale)}
        </time>
      </header>

      {project.cover && (
        <div className="animate-rise mx-auto mt-12 max-w-6xl px-5 sm:mt-16 sm:px-8" style={{ animationDelay: "0.24s" }}>
          <Picture
            asset={project.cover}
            alt={project.title}
            priority
            sizes="(min-width: 1200px) 1152px, 100vw"
            maxHeight={COVER_MAX_H}
            className="rounded-card"
          />
        </div>
      )}

      <div className="mx-auto mt-16 max-w-[1400px] px-5 sm:mt-24 sm:px-8">
        <BlockRenderer blocks={project.blocks} media={project.media} dict={dict} />
      </div>

      {project.next && (
        <Reveal className="mx-auto mt-24 max-w-[1400px] px-5 sm:mt-32 sm:px-8">
          <Link
            href={`/${locale}/projects/${project.next.slug}`}
            data-cursor={dict.common.view}
            className="group grid items-center gap-6 border-t border-border pt-10 sm:grid-cols-[1fr_auto] sm:pt-14"
          >
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-muted">{dict.common.nextProject}</p>
              <p className="mt-3 flex items-center gap-4 font-display text-3xl font-bold tracking-tight transition-colors duration-300 group-hover:text-accent sm:text-5xl">
                {project.next.title}
                <ArrowRight className="size-7 shrink-0 transition-transform duration-500 ease-out-expo group-hover:translate-x-2 sm:size-10" />
              </p>
            </div>
            {project.next.cover && (
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-card sm:w-72">
                <Picture
                  asset={project.next.cover}
                  fill
                  sizes="(min-width: 640px) 288px, 100vw"
                  imgClassName="transition-transform duration-[1.4s] ease-out-expo group-hover:scale-105"
                />
              </div>
            )}
          </Link>
        </Reveal>
      )}
    </article>
  );
}
