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
  .hands{position:absolute;left:-68px;top:-250px;width:620px;height:1102px;
    background:url("${asset(wedding.assets.opening.joinedHands.replace(/^\//, ""))}") center/contain no-repeat;
    -webkit-mask-image:radial-gradient(ellipse 52% 42% at 49% 58%,#000 55%,transparent 92%)}
  .glow{position:absolute;left:0;top:0;width:620px;height:630px;background:radial-gradient(circle at 235px 411px,rgba(255,244,214,.7),transparent 160px)}
  .veil{position:absolute;right:0;top:0;width:760px;height:630px;background:radial-gradient(ellipse 70% 75% at 60% 50%,rgba(255,249,239,.82),rgba(255,249,239,.35) 60%,transparent 85%)}
  .frame{position:absolute;inset:24px;border:1.5px solid #D0AF72;border-radius:18px}
  .frame2{position:absolute;inset:32px;border:1px solid rgba(208,175,114,.5);border-radius:12px}
  .wrap{position:absolute;left:470px;right:40px;top:0;bottom:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center}
  .om{font-family:"Tiro Devanagari Sanskrit",serif;font-size:40px;color:#8A642F;line-height:1}
  .eyebrow{font-family:Jost,sans-serif;font-weight:500;font-size:17px;letter-spacing:.34em;text-transform:uppercase;color:#3D5A73;margin-top:14px}
  .names{font-family:"Cormorant Garamond",serif;font-weight:600;font-size:96px;line-height:.98;color:#173B56;margin-top:16px}
  .and{display:block;font-style:italic;font-weight:500;font-size:58px;color:#8A642F;line-height:1.05}
  .rule{display:flex;align-items:center;gap:14px;margin-top:22px}
  .rule span{display:block;width:110px;height:1px;background:#D0AF72}
  .rule i{display:block;width:9px;height:9px;border:1px solid #D0AF72;transform:rotate(45deg)}
  .date{font-family:Jost,sans-serif;font-weight:500;font-size:21px;letter-spacing:.2em;text-transform:uppercase;color:#8A642F;margin-top:18px}
  .place{font-family:Jost,sans-serif;font-size:18px;letter-spacing:.14em;color:#3D5A73;margin-top:6px}
</style></head><body>
<div class="glow"></div><div class="hands"></div><div class="veil"></div>
<div class="frame"></div><div class="frame2"></div>
<div class="wrap">
  <div class="om">ॐ</div>
  <div class="eyebrow">Wedding Invitation</div>
  <div class="names">${esc(wedding.couple.bride.displayName)}<span class="and">&amp;</span>${esc(wedding.couple.groom.displayName)}</div>
  <div class="rule"><span></span><i></i><span></span></div>
  ${dateLine ? `<div class="date">${esc(dateLine)}</div>` : ""}
  ${wedding.venue.city ? `<div class="place">${esc(wedding.venue.city)}</div>` : ""}
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
