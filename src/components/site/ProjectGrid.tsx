import { Reveal } from "@/components/motion/Reveal";
import type { ProjectCard as ProjectCardData } from "@/lib/content/queries";
import type { Locale } from "@/lib/i18n/config";
import { ProjectCard } from "./ProjectCard";

interface Props {
  projects: ProjectCardData[];
  locale: Locale;
  viewLabel: string;
  emptyLabel: string;
  /** How many leading cards are likely visible on load. */
  priorityCount?: number;
}

export function ProjectGrid({ projects, locale, viewLabel, emptyLabel, priorityCount = 0 }: Props) {
  if (projects.length === 0) return <p className="py-16 text-center text-muted">{emptyLabel}</p>;

  return (
    <div className="grid gap-x-8 gap-y-14 md:grid-cols-2 md:gap-y-20">
      {projects.map((project, i) => {
        const card = (
          <ProjectCard project={project} locale={locale} viewLabel={viewLabel} priority={i < priorityCount} />
        );
        // Priority cards render immediately — fading them in would delay LCP.
        return i < priorityCount ? (
          <div key={project.id}>{card}</div>
        ) : (
          <Reveal key={project.id} delay={(i % 2) * 0.08}>
            {card}
          </Reveal>
        );
      })}
    </div>
  );
}
