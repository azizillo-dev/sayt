import Link from "next/link";
import { Picture } from "@/components/media/Picture";
import type { ProjectCard as ProjectCardData } from "@/lib/content/queries";
import type { Locale } from "@/lib/i18n/config";
import { formatDate } from "@/lib/i18n/format";

interface Props {
  project: ProjectCardData;
  locale: Locale;
  viewLabel: string;
  /** First cards are above the fold and load with priority. */
  priority?: boolean;
}

export function ProjectCard({ project, locale, viewLabel, priority }: Props) {
  return (
    <Link href={`/${locale}/projects/${project.slug}`} className="group block" data-cursor={viewLabel}>
      <div className="relative aspect-[4/3] overflow-hidden rounded-card bg-surface">
        {project.cover && (
          <Picture
            asset={project.cover}
            fill
            priority={priority}
            sizes="(min-width: 1400px) 680px, (min-width: 768px) 50vw, 100vw"
            imgClassName="transition-transform duration-[1.4s] ease-out-expo group-hover:scale-[1.04]"
          />
        )}
      </div>
      <div className="mt-5 px-1">
        <time dateTime={project.date} className="text-sm text-muted">
          {formatDate(project.date, locale)}
        </time>
        <h3 className="mt-1.5 font-display text-xl font-bold leading-snug tracking-tight transition-colors duration-300 group-hover:text-accent sm:text-2xl">
          {project.title}
        </h3>
        {project.excerpt && <p className="mt-2 line-clamp-2 leading-relaxed text-muted">{project.excerpt}</p>}
      </div>
    </Link>
  );
}
