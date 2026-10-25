import puppeteer from "puppeteer-core";
import postgres from "postgres";
process.loadEnvFile(".env");
const BASE = process.argv[2] ?? "http://localhost:3000";
const sql = postgres(process.env.DATABASE_URL);
const vids = await sql`select id from video_items where is_published order by sort_order, created_at`;
await sql.end();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await puppeteer.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: "new", args: ["--autoplay-policy=no-user-gesture-required"] });
const state = (page) => page.evaluate(() => {
  const feed = document.querySelector("[data-lenis-prevent].snap-y");
  const idx = Math.round(feed.scrollTop / feed.clientHeight);
  const vs = [...document.querySelectorAll("[role=dialog] video")];
  return { idx, playing: vs.map((v, i) => (!v.paused ? i : null)).filter((x) => x !== null), muted: vs[idx]?.muted, url: location.pathname.split("/").pop().slice(0, 8) };
});
for (const mobile of [false, true]) {
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.setViewport({ width: mobile ? 390 : 1440, height: mobile ? 844 : 900, isMobile: mobile, hasTouch: mobile });
  await page.goto(`${BASE}/uz/videos/${vids[1].id}`, { waitUntil: "networkidle2" }); await sleep(1500);
  const tag = mobile ? "mobile " : "desktop";
  console.log(tag, "opened on #1:", JSON.stringify(await state(page)), "expected url", vids[1].id.slice(0, 8));
  await page.screenshot({ path: `audit/review/${mobile ? "m" : "d"}-reels.png` });
  if (!mobile) {
    await page.mouse.move(720, 450);
    await page.mouse.wheel({ deltaY: 100 }); await sleep(1200);
    console.log(tag, "one wheel notch down:", JSON.stringify(await state(page)));
    for (let i = 0; i < 12; i++) { await page.mouse.wheel({ deltaY: 8 }); await sleep(16); } await sleep(1200);
    console.log(tag, "trackpad flick (12 small events):", JSON.stringify(await state(page)));
    await page.keyboard.press("ArrowUp"); await sleep(1000);
    console.log(tag, "ArrowUp:", JSON.stringify(await state(page)));
  } else {
    // A swipe up: native scroll-snap does the rest.
    await page.evaluate(() => { const f = document.querySelector("[data-lenis-prevent].snap-y"); f.scrollBy({ top: f.clientHeight * 0.7 }); }); await sleep(1500);
    console.log(tag, "swipe up:", JSON.stringify(await state(page)));
  }
  const s = await state(page);
  const center = mobile ? { x: 195, y: 422 } : { x: 720, y: 450 };
  if (mobile) await page.touchscreen.tap(center.x, center.y); else await page.mouse.click(center.x, center.y);
  await sleep(500);
  console.log(tag, "tap video → paused?", JSON.stringify(await state(page)), "play icon:", !!(await page.$("[role=dialog] svg.fill-white")));
  await page.click(`[role=dialog] section[data-index="${s.idx}"] button[aria-pressed]`); await sleep(500);
  console.log(tag, "mute button → muted:", (await state(page)).muted, " errors:", errors.length);
  await page.close();
}
await browser.close();
