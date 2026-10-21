#!/usr/bin/env node
/**
 * Generates public/og-image.jpg (1200×630) — the WhatsApp / social link
 * preview — from src/config/wedding.ts, using a locally installed Chrome or
 * Edge in headless mode.
 *
 *   npm run og
 *
 * Re-run whenever the couple's names, date or city change.
 * Set CHROME_PATH to point at a specific browser if needed.
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { createServer } from "vite";

const root = path.resolve(import.meta.dirname, "..");
const out = path.join(root, "public", "og-image.jpg");
const asset = (p) => pathToFileURL(path.join(root, "public", p)).href;

// ── Load the wedding config through Vite (it is TypeScript) ──
const vite = await createServer({ root, logLevel: "error", server: { middlewareMode: true }, appType: "custom" });
const { wedding } = await vite.ssrLoadModule("/src/config/wedding.ts");
const { formatVenueDate, parseVenueDateTime } = await vite.ssrLoadModule("/src/lib/venueTime.ts");
await vite.close();

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const parts = parseVenueDateTime(wedding.wedding.dateTime);
const date = parts ? formatVenueDate(parts) : null;
const dateLine = date ? `${date.weekday} · ${date.day} ${date.month} ${date.year}` : "";

const html = `<!doctype html><html><head><meta charset="utf-8">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,600;1,500&family=Jost:wght@500&family=Tiro+Devanagari+Sanskrit&display=block">
<style>
  html,body{margin:0;width:1200px;height:630px;overflow:hidden}
  body{background:#8fd8fb url("${asset(wedding.assets.sky.replace(/^\//, ""))}") center/cover}
  .veil{position:absolute;left:0;right:0;top:0;height:330px;background:radial-gradient(ellipse 52% 90% at 50% 18%,rgba(255,249,239,.85),rgba(255,249,239,.35) 60%,transparent 85%)}
  .fade{position:absolute;inset:0;-webkit-mask-image:linear-gradient(to right,#000 76%,transparent 84%)}
  .hands{position:absolute;left:146px;top:196px;width:860px;aspect-ratio:792/581;
    -webkit-mask-image:radial-gradient(ellipse 60% 64% at 52.8% 46.6%,#000 62%,transparent 100%)}
  .hands img{position:absolute;inset:0;width:100%;height:100%}
  .glow{position:absolute;left:600px;top:490px;width:240px;height:240px;margin:-120px 0 0 -120px;border-radius:50%;
    background:radial-gradient(circle,rgba(255,248,228,.95) 0,rgba(250,226,168,.7) 20%,rgba(232,198,128,.3) 42%,transparent 70%)}
  .frame{position:absolute;inset:24px;border:1.5px solid #D0AF72;border-radius:18px}
  .frame2{position:absolute;inset:32px;border:1px solid rgba(208,175,114,.5);border-radius:12px}
  .wrap{position:absolute;left:0;right:0;top:46px;display:flex;flex-direction:column;align-items:center;text-align:center}
  .om{font-family:"Tiro Devanagari Sanskrit",serif;font-size:34px;color:#8A642F;line-height:1}
  .eyebrow{font-family:Jost,sans-serif;font-weight:500;font-size:15px;letter-spacing:.34em;text-transform:uppercase;color:#3D5A73;margin-top:10px}
  .names{font-family:"Cormorant Garamond",serif;font-weight:600;font-size:76px;line-height:1.05;color:#173B56;margin-top:6px}
  .and{font-style:italic;font-weight:500;color:#8A642F;margin:0 14px}
  .date{font-family:Jost,sans-serif;font-weight:500;font-size:17px;letter-spacing:.2em;text-transform:uppercase;color:#8A642F;margin-top:6px}
</style></head><body>
<div class="veil"></div>
<div class="fade"><div class="hands"><img src="${asset(wedding.assets.opening.shivaHand.slice(1))}"><img src="${asset(wedding.assets.opening.parvatiHand.slice(1))}"></div></div>
<div class="glow"></div>
<div class="frame"></div><div class="frame2"></div>
<div class="wrap">
  <div class="om">ॐ</div>
  <div class="eyebrow">Wedding Invitation</div>
  <div class="names">${esc(wedding.couple.bride.displayName)}<span class="and">&amp;</span>${esc(wedding.couple.groom.displayName)}</div>
  ${dateLine ? `<div class="date">${esc([dateLine, wedding.venue.city].filter(Boolean).join(" · "))}</div>` : ""}
</div>
</body></html>`;

// ── Render with a headless browser ──
const candidates = [
  process.env.CHROME_PATH,
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
].filter(Boolean);
const browser = candidates.find((p) => existsSync(p));
if (!browser) {
  console.error("No Chrome/Edge found. Set CHROME_PATH to a Chromium-based browser and try again.");
  process.exit(1);
}

const work = mkdtempSync(path.join(tmpdir(), "divine-og-"));
const page = path.join(work, "og.html");
writeFileSync(page, html, "utf8");
try {
  execFileSync(
    browser,
    [
      "--headless=new",
      "--disable-gpu",
      "--hide-scrollbars",
      "--allow-file-access-from-files",
      "--force-device-scale-factor=1",
      "--window-size=1200,630",
      "--virtual-time-budget=8000",
      `--user-data-dir=${path.join(work, "profile")}`,
      `--screenshot=${out}`,
      pathToFileURL(page).href,
    ],
    { stdio: "ignore" },
  );
} finally {
  rmSync(work, { recursive: true, force: true });
}

console.log(existsSync(out) ? `✓ Wrote ${path.relative(root, out)}` : "✗ Screenshot failed");
