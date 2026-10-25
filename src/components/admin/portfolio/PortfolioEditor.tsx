"use client";

import { ExternalLink, FileText, Save, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { GalleryField } from "@/components/admin/media/GalleryField";
import { MediaField } from "@/components/admin/media/MediaField";
import { uploadPdf } from "@/components/admin/media/upload";
import { useToast } from "@/components/admin/Toaster";
import { Button, buttonClass, Card, Field, Input, SaveBar, Select, Switch } from "@/components/admin/ui";
import { savePortfolioItem } from "@/lib/admin/actions/portfolio";
import { useDirtyState, useMediaMap, useSaveShortcut, useUnsavedGuard } from "@/components/admin/editor/hooks";
import type { MediaMap } from "@/lib/media/types";
import { portfolioCategories } from "@/lib/portfolio/categories";

interface FormValue {
  id: string | null;
  category: string;
  title: string;
  coverId: string | null;
  galleryIds: string[];
  openMode: "gallery" | "pdf";
  pdfKey: string | null;
  pdfName: string | null;
  pdfUrl: string | null;
  isPublished: boolean;
}

export function PortfolioEditor({ initial, initialMedia }: { initial: FormValue; initialMedia: MediaMap }) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [media, addMedia] = useMediaMap(initialMedia);
  const { value, setValue, dirty, markSaved } = useDirtyState(initial);
  const set = (patch: Partial<FormValue>) => setValue((current) => ({ ...current, ...patch }));
  useUnsavedGuard(dirty);

  const save = () => startTransition(async () => {
    const result = await savePortfolioItem({
      id: value.id,
      category: value.category,
      title: value.title,
      coverId: value.coverId ?? "",
      galleryIds: value.galleryIds,
      openMode: value.openMode,
      pdfKey: value.pdfKey,
      pdfName: value.pdfName,
      isPublished: value.isPublished,
    });
    if (!toast.result(result, "Portfolio ishi saqlandi")) return;
    markSaved({ ...value, id: result.data.id });
    if (!value.id) router.replace(`/admin/portfolio/${result.data.id}`);
    router.refresh();
  });
  useSaveShortcut(() => !pending && uploadProgress === null && save());

  const upload = async (file: File) => {
    setUploadProgress(0);
    try {
      const pdf = await uploadPdf(file, setUploadProgress);
      set({ pdfKey: pdf.key, pdfName: pdf.fileName, pdfUrl: pdf.url });
      toast.show("PDF yuklandi", "success");
    } catch (error) {
      toast.show((error as Error).message, "error");
    } finally {
      setUploadProgress(null);
    }
  };

  const cover = value.coverId ? media[value.coverId] ?? null : null;
  const gallery = value.galleryIds.map((id) => media[id]).filter((asset): asset is NonNullable<typeof asset> => Boolean(asset));

  return <div className="grid min-w-0 gap-4 sm:gap-6 xl:grid-cols-[1fr_340px]">
    <div className="min-w-0 space-y-4 sm:space-y-6">
      <Card title="Ish haqida">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Ish nomi"><Input value={value.title} onChange={(e) => set({ title: e.target.value })} placeholder="Masalan, VitaNext" maxLength={160} /></Field>
          <Field label="Bo'lim">
            <Select value={value.category} onChange={(e) => set({ category: e.target.value })}>
              {portfolioCategories.map((category) => <option key={category.slug} value={category.slug}>{category.title}</option>)}
            </Select>
          </Field>
        </div>
      </Card>
      <Card title="Muqova rasmi" description="Bo'limdagi markaziy va yon kartalarda shu rasm ko'rinadi.">
        <MediaField value={cover} onChange={(asset) => {
          if (asset) addMedia(asset);
          set({ coverId: asset?.id ?? null });
        }} />
      </Card>
      <Card title="Bosilganda ochilishi">
        <div className="space-y-4">
          <Field label="Turi">
            <Select value={value.openMode} onChange={(e) => set({ openMode: e.target.value as FormValue["openMode"] })}>
              <option value="gallery">Rasmlar galereyasi</option>
              <option value="pdf">PDF hujjat</option>
            </Select>
          </Field>
          {value.openMode === "gallery" ? <div>
            <p className="mb-2 text-sm font-semibold">Galereya rasmlari</p>
            <GalleryField value={gallery} onChange={(assets) => {
              assets.forEach(addMedia);
              set({ galleryIds: assets.map((asset) => asset.id) });
            }} />
            <p className="mt-2 text-xs text-muted">Rasmlarni sudrab tartiblang. Muqova galereyaga avtomatik qo'shilmaydi.</p>
          </div> : <div className="space-y-3">
            <label className="flex min-h-24 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-bg p-4 text-center hover:border-accent">
              <FileText className="size-5" />
              <span className="text-sm font-semibold">{uploadProgress === null ? "PDF yuklash yoki almashtirish" : `Yuklanmoqda ${Math.round(uploadProgress * 100)}%`}</span>
              <span className="text-xs text-muted">PDF, 40 MB gacha</span>
              <input type="file" accept="application/pdf,.pdf" className="sr-only" disabled={uploadProgress !== null} onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void upload(file);
                e.target.value = "";
              }} />
            </label>
            {value.pdfKey && <div className="flex min-w-0 items-center gap-2 rounded-xl border border-border p-2.5 text-sm">
              <FileText className="size-4 shrink-0" />
              <span className="min-w-0 flex-1 truncate">{value.pdfName || "PDF"}</span>
              {value.pdfUrl && <a href={value.pdfUrl} target="_blank" rel="noreferrer" aria-label="PDFni ko'rish" className={buttonClass("ghost", "sm")}><ExternalLink className="size-4" /></a>}
              <Button size="sm" variant="danger" aria-label="PDFni olib tashlash" onClick={() => set({ pdfKey: null, pdfName: null, pdfUrl: null })}><X className="size-4" /></Button>
            </div>}
          </div>}
        </div>
      </Card>
    </div>
    <div className="min-w-0 space-y-4 sm:space-y-6">
      <Card title="Ko'rinishi">
        <Switch checked={value.isPublished} onChange={(isPublished) => set({ isPublished })} label="Saytda ko'rinsin" description="O'chirilsa, bo'limda chiqmaydi" />
      </Card>
      <Card title="Maslahat">
        <p className="text-sm leading-relaxed text-muted">Muqova sifatida ishni tanitadigan bitta rasm yuklang. Galereya uchun ichki sahifalarni kerakli tartibda qo'shing yoki PDF faylni tanlang.</p>
      </Card>
    </div>
    <div className="xl:col-span-2">
      <SaveBar status={dirty ? "Saqlanmagan o'zgarishlar bor" : ""}>
        <Link href="/admin/portfolio" className={buttonClass("ghost")}>Ro'yxatga qaytish</Link>
        <Button variant="primary" onClick={save} loading={pending} disabled={uploadProgress !== null} icon={<Save className="size-4" />}>Saqlash</Button>
      </SaveBar>
    </div>
  </div>;
}
