"use client";

import { ArrowLeft, House } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { canGoBackInSite } from "@/lib/client-history";

interface Props {
  /** Where "back" goes when there is no in-site history (shared links). */
  fallback: string;
  label: string;
  /** Shown as a second link so visitors can reach the home page in one tap. */
  home?: { href: string; label: string };
}

const linkClass = "group inline-flex items-center gap-2 text-sm font-semibold text-muted transition-colors hover:text-fg";

export function BackLink({ fallback, label, home }: Props) {
  const router = useRouter();

  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
      <Link
        href={fallback}
        onClick={(e) => {
          // Going back keeps the previous page's scroll position.
          if (canGoBackInSite()) {
            e.preventDefault();
            router.back();
          }
        }}
        className={linkClass}
      >
        <ArrowLeft className="size-4 transition-transform duration-300 group-hover:-translate-x-1" />
        {label}
      </Link>

      {home && home.href !== fallback && (
        <Link href={home.href} className={linkClass}>
          <House className="size-4" />
          {home.label}
        </Link>
      )}
    </div>
  );
}
