import type { Metadata } from "next";
import { BackLink } from "@/components/site/BackLink";
import { VideoCard } from "@/components/site/VideoCard";
import { resolveLocale } from "@/lib/content/navigation";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getVideos } from "@/lib/videos/queries";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  return { title: getDictionary(await resolveLocale(params)).videos.title };
}

export default async function VideosPage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = await resolveLocale(params);
  const dict = getDictionary(locale);
  const videos = await getVideos();
  return <section className="mx-auto min-h-[75dvh] max-w-[1400px] px-5 pb-20 pt-[calc(var(--header-h)+2rem)] sm:px-8 sm:pt-[calc(var(--header-h)+3rem)]">
    <BackLink fallback={`/${locale}#videos`} label={dict.common.back} home={{ href: `/${locale}`, label: dict.nav.home }} />
    <div className="mt-10 max-w-2xl"><p className="text-xs font-bold uppercase tracking-[0.25em] text-accent">Portfolio</p><h1 className="mt-3 font-display text-[clamp(2.8rem,8vw,5rem)] font-bold tracking-tight">{dict.videos.title}</h1></div>
    {videos.length ? <div className="mt-10 grid grid-cols-2 justify-items-center gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">{videos.map((item) => <VideoCard key={item.id} item={item} locale={locale} />)}</div>
      : <p className="py-20 text-center text-muted">{dict.videos.empty}</p>}
  </section>;
}
