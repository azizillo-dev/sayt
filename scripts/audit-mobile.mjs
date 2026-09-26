/**
 * Responsive audit: opens every page in a phone-sized Chrome window, reports
 * horizontal overflow (with the offending elements) and writes screenshots.
 *
 *   npm run audit:mobile              # 390px wide, screenshots in ./audit
 *   npm run audit:mobile -- out 360   # custom folder and width
 *
 * The dev server must be running on :3000.
 */
import { mkdirSync } from "node:fs";
import { SignJWT } from "jose";
import postgres from "postgres";
import puppeteer from "puppeteer-core";

process.loadEnvFile(".env");
const OUT = process.argv[2] ?? "audit";
const WIDTH = Number(process.argv[3] ?? 390);
mkdirSync(OUT, { recursive: true });

const sql = postgres(process.env.DATABASE_URL);
const [admin] = await sql`select id, session_version from admins limit 1`;
await sql.end();
const token = await new SignJWT({ ver: admin.session_version })
  .setProtectedHeader({ alg: "HS256" })
  .setSubject(admin.id)
  .setIssuedAt()
  .setExpirationTime("1h")
  .sign(new TextEncoder().encode(process.env.AUTH_SECRET));

const [{ id: projectId }] = await (async () => {
  const s = postgres(process.env.DATABASE_URL);
  const rows = await s`select id from projects order by sort_order limit 1`;
  await s.end();
  return rows;
})();

const pages = [
  ["dashboard", "/admin"],
  ["projects", "/admin/projects"],
  ["project-edit", `/admin/projects/${projectId}`],
  ["partners", "/admin/partners"],
  ["about", "/admin/about"],
  ["pages", "/admin/pages"],
  ["social", "/admin/social"],
  ["messages", "/admin/messages"],
  ["theme", "/admin/theme"],
  ["settings", "/admin/settings"],
  ["site-home", "/uz"],
  ["site-project", "/uz/projects/non-uyi-brending"],
  ["site-partners", "/uz/partners"],
];

const browser = await puppeteer.launch({
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: "new",
  args: [`--window-size=${WIDTH},900`],
});

const page = await browser.newPage();
await page.setViewport({ width: WIDTH, height: 900, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
await browser.setCookie({ name: "admin_session", value: token, domain: "localhost", path: "/" });

const problems = [];
for (const [name, path] of pages) {
  await page.goto(`http://localhost:3000${path}`, { waitUntil: "networkidle2", timeout: 120_000 });
  await new Promise((r) => setTimeout(r, 600));

  const report = await page.evaluate(() => {
    const docWidth = document.documentElement.scrollWidth;
    const view = window.innerWidth;
    const offenders = [];
    if (docWidth > view + 1) {
      for (const el of document.querySelectorAll("body *")) {
        const r = el.getBoundingClientRect();
        if (r.width === 0 && r.height === 0) continue;
        if (r.right > view + 1 || r.left < -1) {
          const style = getComputedStyle(el);
          if (style.position === "fixed" && r.left < 0) continue; // off-canvas drawer
          offenders.push({
            tag: el.tagName.toLowerCase(),
            cls: (el.className?.toString?.() ?? "").slice(0, 90),
            right: Math.round(r.right),
            width: Math.round(r.width),
          });
        }
      }
    }
    return { docWidth, view, offenders: offenders.slice(0, 6) };
  });

  if (report.docWidth > report.view + 1) problems.push({ name, ...report });
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: false });
  console.log(`${name.padEnd(14)} doc=${report.docWidth} view=${report.view}${report.docWidth > report.view + 1 ? "  ← OVERFLOW" : ""}`);
  for (const o of report.offenders) console.log(`   ${o.tag}.${o.cls} right=${o.right} w=${o.width}`);
}

await browser.close();
console.log(problems.length ? `\n${problems.length} page(s) overflow` : "\nNo horizontal overflow");
