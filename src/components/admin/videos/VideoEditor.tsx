"use client";

import { Save } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useDirtyState, useMediaMap, useSaveShortcut, useUnsavedGuard } from "@/components/admin/editor/hooks";
import { MediaField } from "@/components/admin/media/MediaField";
import { useToast } from "@/components/admin/Toaster";
import { Button, buttonClass, Card, Field, Input, SaveBar, Switch } from "@/components/admin/ui";
import { saveVideoItem } from "@/lib/admin/actions/videos";
import type { MediaMap } from "@/lib/media/types";

interface FormValue { id: string | null; title: string; coverId: string | null; videoId: string | null; isPublished: boolean }

export function VideoEditor({ initial, initialMedia }: { initial: FormValue; initialMedia: MediaMap }) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const [media, addMedia] = useMediaMap(initialMedia);
  const { value, setValue, dirty, markSaved } = useDirtyState(initial);
  const set = (patch: Partial<FormValue>) => setValue((current) => ({ ...current, ...patch }));
  useUnsavedGuard(dirty);

  const save = () => startTransition(async () => {
    const result = await saveVideoItem({ id: value.id, title: value.title, coverId: value.coverId ?? "", videoId: value.videoId ?? "", isPublished: value.isPublished });
    if (!toast.result(result, "Video saqlandi")) return;
    markSaved({ ...value, id: result.data.id });
    if (!value.id) router.replace(`/admin/videos/${result.data.id}`);
    router.refresh();
  });
  useSaveShortcut(() => !pending && save());
  const cover = value.coverId ? media[value.coverId] ?? null : null;
  const video = value.videoId ? media[value.videoId] ?? null : null;

  return <div className="grid min-w-0 gap-4 sm:gap-6 xl:grid-cols-[1fr_300px]">
    <div className="min-w-0 space-y-4 sm:space-y-6">
      <Card title="Video haqida"><Field label="Nomi"><Input value={value.title} onChange={(event) => set({ title: event.target.value })} maxLength={160} placeholder="Masalan, CESAM animatsiyasi" /></Field></Card>
      <Card title="Video" description="Vertikal MP4 yoki WebM, 60 soniyagacha."><MediaField kind="video" aspect="auto" value={video} onChange={(asset) => { if (asset) addMedia(asset); set({ videoId: asset?.id ?? null }); }} /></Card>
      <Card title="Muqova rasmi" description="Videolar ro'yxatida ochiladigan vertikal rasm."><MediaField aspect="auto" value={cover} onChange={(asset) => { if (asset) addMedia(asset); set({ coverId: asset?.id ?? null }); }} /></Card>
    </div>
    <div className="min-w-0"><Card title="Ko'rinishi"><Switch checked={value.isPublished} onChange={(isPublished) => set({ isPublished })} label="Saytda ko'rinsin" description="O'chirilsa, tashrifchilarga chiqmaydi" /></Card></div>
    <div className="xl:col-span-2"><SaveBar status={dirty ? "Saqlanmagan o'zgarishlar bor" : ""}>
      <Link href="/admin/videos" className={buttonClass("ghost")}>Ro'yxatga qaytish</Link>
      <Button variant="primary" onClick={save} loading={pending} icon={<Save className="size-4" />}>Saqlash</Button>
    </SaveBar></div>
  </div>;
}
