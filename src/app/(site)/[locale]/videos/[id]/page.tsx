import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BackLink } from "@/components/site/BackLink";
import { VideoViewer } from "@/components/site/VideoViewer";
import { resolveLocale } from "@/lib/content/navigation";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getVideos } from "@/lib/videos/queries";

type Props = { params: Promise<{ locale: string; id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { title } = getDictionary(await resolveLocale(params)).videos;
  const { id } = await params;
  const item = (await getVideos()).find((video) => video.id === id);
  return { title: item ? `${item.title} | ${title}` : title };
}

export default async function VideoPage({ params }: Props) {
  const locale = await resolveLocale(params);
  const { id } = await params;
  const videos = await getVideos();
  const initialIndex = videos.findIndex((item) => item.id === id);
  if (initialIndex < 0) notFound();
  const dict = getDictionary(locale);
  return <section className="pt-[calc(var(--header-h)+1rem)]">
    <div className="mx-auto max-w-[1400px] px-5 sm:px-8"><BackLink fallback={`/${locale}/videos`} label={dict.common.back} home={{ href: `/${locale}`, label: dict.nav.home }} /></div>
    <VideoViewer items={videos} initialIndex={initialIndex} labels={dict.videos} />
  </section>;
}
