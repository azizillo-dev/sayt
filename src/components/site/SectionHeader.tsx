import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Reveal } from "@/components/motion/Reveal";

interface Props {
  title: string;
  /** Optional "View all →" link on the right. */
  action?: { href: string; label: string } | null;
  as?: "h1" | "h2";
}

export function SectionHeader({ title, action, as: Tag = "h2" }: Props) {
  return (
    <Reveal className="mb-8 flex items-end justify-between gap-6 sm:mb-12">
      <Tag className="font-display text-3xl font-bold tracking-tight sm:text-5xl">{title}</Tag>
      {action && (
        <Link
          href={action.href}
          className="group flex shrink-0 items-center gap-2 pb-1 text-sm font-semibold text-muted transition-colors hover:text-fg sm:text-base"
        >
          {action.label}
          <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
        </Link>
      )}
    </Reveal>
  );
}
