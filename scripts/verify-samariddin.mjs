import { mkdirSync } from "node:fs";
import { SignJWT } from "jose";
import postgres from "postgres";
import puppeteer from "puppeteer-core";

process.loadEnvFile(".env");
const base = process.argv[2] ?? "http://localhost:3100";
const out = process.argv[3] ?? "D:/Temp/samariddin-site-audit";
mkdirSync(out, { recursive: true });
const sql = postgres(process.env.DATABASE_URL);
const [work] = await sql`select category, id, pdf_key from portfolio_items where is_published order by sort_order limit 1`;
const [socialWork] = await sql`select id from portfolio_items where category = 'social-media' and is_published order by sort_order limit 1`;
const categoryCounts = await sql`select category, count(*)::int as count from portfolio_items where is_published group by category`;
const [film] = await sql`select id from video_items where is_published order by sort_order limit 1`;
const [admin] = await sql`select id, session_version from admins limit 1`;
await sql.end();
const token = await new SignJWT({ ver: admin.session_version }).setProtectedHeader({ alg: "HS256" }).setSubject(admin.id).setIssuedAt().setExpirationTime("1h").sign(new TextEncoder().encode(process.env.AUTH_SECRET));
const browser = await puppeteer.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: "new" });
await browser.setCookie({ name: "admin_session", value: token, domain: "localhost", path: "/" });
const paths = [
  ["home", "/uz"],
  ["logo-grid", "/uz/portfolio/logo-branding"],
  ["social-grid", "/uz/portfolio/social-media"],
  ["ads-grid", "/uz/portfolio/advertising-design"],
  ["visual-grid", "/uz/portfolio/visual-design"],
  ["work-detail", `/uz/portfolio/${work.category}/${work.id}`],
  ["social-detail", `/uz/portfolio/social-media/${socialWork.id}`],
  ["videos-grid", "/uz/videos"],
  ["video-detail", `/uz/videos/${film.id}`],
  ["admin-portfolio", "/admin/portfolio"],
  ["admin-videos", "/admin/videos"],
];
const failures = [];
for (const { category, count } of categoryCounts) if (count !== 4) failures.push(`${category}: ${count} works`);
for (const width of [390, 1440]) {
  const page = await browser.newPage();
  await page.setViewport({ width, height: 900, deviceScaleFactor: 1, isMobile: width === 390, hasTouch: width === 390 });
  for (const [name, path] of paths) {
    const response = await page.goto(base + path, { waitUntil: "networkidle2", timeout: 120000 });
    await page.screenshot({ path: `${out}/${name}-${width}.png` });
    const state = await page.evaluate(() => ({
      pageWidth: document.documentElement.scrollWidth,
      viewWidth: window.innerWidth,
      brokenImages: [...document.images].filter((img) => img.complete && img.naturalWidth === 0).length,
      title: document.title,
      hasVideo: Boolean(document.querySelector("video")),
    }));
    const code = response?.status();
    const issue = ![200, 304].includes(code) || state.pageWidth > state.viewWidth + 1 || state.brokenImages > 0 || (name === "video-detail" && !state.hasVideo);
    console.log(`${width} ${name}: HTTP ${code}, width ${state.pageWidth}/${state.viewWidth}, broken images ${state.brokenImages}${issue ? " FAIL" : " OK"}`);
    if (issue) failures.push(`${width} ${name}`);
  }
  await page.close();
}
const pdf = await fetch(`${base}/media/${work.pdf_key}`);
console.log(`PDF: HTTP ${pdf.status}, type ${pdf.headers.get("content-type")}`);
if (pdf.status !== 200 || !pdf.headers.get("content-type")?.includes("pdf")) failures.push("PDF");
const interactionPage = await browser.newPage();
await interactionPage.setViewport({ width: 1440, height: 900 });
await interactionPage.goto(`${base}/uz#videos`, { waitUntil: "networkidle2" });
const homeState = await interactionPage.evaluate(() => {
  const hero = document.querySelector("#work")?.previousElementSibling?.firstElementChild?.getBoundingClientRect();
  const portfolio = document.querySelector("#work > div")?.getBoundingClientRect();
  const previews = [...document.querySelectorAll("#videos video")];
  const preview = previews[0];
  return {
    heroWidth: hero?.width ?? 0,
    portfolioWidth: portfolio?.width ?? 0,
    portfolioHeight: portfolio?.height ?? 0,
    viewportHeight: window.innerHeight,
    autoPlay: preview?.autoplay ?? false,
    muted: preview?.muted ?? false,
    loop: preview?.loop ?? false,
    playsInline: preview?.playsInline ?? false,
    previewCount: previews.length,
    allMutedLoops: previews.every((video) => video.autoplay && video.muted && video.loop && video.playsInline),
    detailHref: preview?.closest("a")?.getAttribute("href") ?? "",
  };
});
if (Math.abs(homeState.heroWidth - homeState.portfolioWidth) > 1) failures.push("hero/portfolio width");
if (homeState.portfolioHeight > homeState.viewportHeight - 100) failures.push("portfolio viewport height");
if (homeState.previewCount !== 4 || !homeState.allMutedLoops || !homeState.detailHref.startsWith("/uz/videos/")) failures.push("video preview");
console.log(`Home blocks: ${homeState.heroWidth}/${homeState.portfolioWidth}px wide, portfolio ${homeState.portfolioHeight}/${homeState.viewportHeight}px high; ${homeState.previewCount} muted, looping videos=${homeState.allMutedLoops}`);
await interactionPage.$eval("#work", (element) => element.scrollIntoView());
await interactionPage.screenshot({ path: `${out}/home-portfolio-1440.png` });
await interactionPage.$eval("#videos", (element) => element.scrollIntoView());
await new Promise((resolve) => setTimeout(resolve, 1200));
const playback = await interactionPage.$$eval("#videos video", (videos) => videos.map((video) => ({ paused: video.paused, time: video.currentTime })));
if (playback.length !== 4 || playback.some((video) => video.paused || video.time <= 0)) failures.push("autoplay playback");
console.log(`Autoplay playback: ${playback.map((video) => `${video.paused ? "paused" : "playing"}@${video.time.toFixed(1)}s`).join(", ")}`);
await interactionPage.screenshot({ path: `${out}/home-videos-1440.png` });
await interactionPage.goto(`${base}/uz/portfolio/social-media/${socialWork.id}`, { waitUntil: "networkidle2" });
const carouselOpacity = await interactionPage.$$eval('[aria-label="Portfolio ishlari"] > div:first-child > button', (buttons) => buttons.map((button) => Number(getComputedStyle(button).opacity)));
if (carouselOpacity.filter((opacity) => opacity > 0.01).length !== 3 || carouselOpacity.filter((opacity) => opacity > 0.01 && opacity < 1).length !== 2) failures.push("three-card carousel");
console.log(`Carousel visible cards: ${carouselOpacity.filter((opacity) => opacity > 0.01).length}, dimmed sides: ${carouselOpacity.filter((opacity) => opacity > 0.01 && opacity < 1).length}`);
const before = await interactionPage.$eval('[aria-label="Portfolio ishlari"] [aria-current="true"]', (el) => el.getAttribute("aria-label"));
await interactionPage.click('[aria-label="Keyingi ish"]');
const after = await interactionPage.$eval('[aria-label="Portfolio ishlari"] [aria-current="true"]', (el) => el.getAttribute("aria-label"));
if (before === after) failures.push("portfolio arrows");
await interactionPage.click('[aria-label="Portfolio ishlari"] [aria-current="true"]');
const lightboxOpened = await interactionPage.evaluate(() => Boolean(document.querySelector('[role="dialog"]')));
if (!lightboxOpened) failures.push("portfolio lightbox");
console.log(`Portfolio carousel: ${before !== after ? "arrows OK" : "arrows FAIL"}, ${lightboxOpened ? "lightbox OK" : "lightbox FAIL"}`);
await interactionPage.goto(`${base}/uz/videos/${film.id}`, { waitUntil: "networkidle2" });
const videoState = await interactionPage.$eval("video", (el) => ({ autoplay: el.autoplay, width: el.videoWidth, height: el.videoHeight }));
if (videoState.autoplay || videoState.width !== 1080 || videoState.height !== 1920) failures.push("portrait video");
console.log(`Portrait video: ${videoState.width}x${videoState.height}, autoplay=${videoState.autoplay}`);
const feedState = await interactionPage.$eval('[aria-label="Videolar tasmasi"]', (feed) => {
  const videos = [...feed.querySelectorAll("video")];
  const state = { count: videos.length, scrollHeight: feed.scrollHeight, viewportHeight: feed.clientHeight, sideArrows: feed.querySelectorAll('[aria-label="Keyingi video"], [aria-label="Oldingi video"]').length };
  feed.scrollTop = feed.clientHeight;
  return state;
});
await new Promise((resolve) => setTimeout(resolve, 700));
const playbackAfterScroll = await interactionPage.$$eval('[aria-label="Videolar tasmasi"] video', (videos) => videos.slice(0, 2).map((video) => video.paused));
if (feedState.count !== 4 || feedState.scrollHeight <= feedState.viewportHeight || feedState.sideArrows || !playbackAfterScroll[0] || playbackAfterScroll[1]) failures.push("vertical reels scrolling");
console.log(`Vertical reels: ${feedState.count} videos, scrolled to next, first paused=${playbackAfterScroll[0]}, second playing=${!playbackAfterScroll[1]}`);
await interactionPage.close();
await browser.close();
if (failures.length) { console.error(`Failed: ${failures.join(", ")}`); process.exit(1); }
console.log("All site checks passed.");
