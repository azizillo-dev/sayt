"use client";

import { Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { MediaField } from "@/components/admin/media/MediaField";
import { useToast } from "@/components/admin/Toaster";
import { Button, Card } from "@/components/admin/ui";
import { savePortfolioCovers } from "@/lib/admin/actions/portfolio";
import type { MediaAsset } from "@/lib/media/types";
import { portfolioCategories, type PortfolioCategory } from "@/lib/portfolio/categories";

type Covers = Record<PortfolioCategory, MediaAsset | null>;

export function PortfolioCoverEditor({ initial }: { initial: Covers }) {
  const [covers, setCovers] = useState(initial);
  const [saved, setSaved] = useState(() => JSON.stringify(portfolioCategories.map((category) => initial[category.slug]?.id ?? null)));
  const [pending, startTransition] = useTransition();
  const toast = useToast();
  const router = useRouter();
  const current = JSON.stringify(portfolioCategories.map((category) => covers[category.slug]?.id ?? null));

  const save = () => startTransition(async () => {
    const result = await savePortfolioCovers({
      "logo-branding": covers["logo-branding"]?.id ?? null,
      "social-media": covers["social-media"]?.id ?? null,
      "advertising-design": covers["advertising-design"]?.id ?? null,
      "visual-design": covers["visual-design"]?.id ?? null,
    });
    if (!toast.result(result, "Portfolio rasmlari saqlandi")) return;
    setSaved(current);
    router.refresh();
  });

  return <Card title="Bosh sahifadagi portfolio rasmlari" description="Tugma ustiga borganda mos yo'nalish rasmi ko'rinadi. Har birini alohida almashtira olasiz." className="mb-6">
    <div className="grid gap-5 sm:grid-cols-2">
      {portfolioCategories.map((category) => <div key={category.slug} className="min-w-0">
        <p className="mb-2 text-sm font-semibold">{category.title}</p>
        <MediaField value={covers[category.slug]} onChange={(asset) => setCovers((value) => ({ ...value, [category.slug]: asset }))} allowLossless={false} />
      </div>)}
    </div>
    <div className="mt-5 flex justify-end"><Button variant="primary" icon={<Save className="size-4" />} onClick={save} loading={pending} disabled={current === saved}>Saqlash</Button></div>
  </Card>;
}
