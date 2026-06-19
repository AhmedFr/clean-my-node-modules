// Regenerate the social-share image (public/og.png) by screenshotting the
// /og card route with headless Chromium.
//
// One-time setup (playwright is not a committed dependency):
//   pnpm add -D playwright && pnpm exec playwright install chromium
// Then, with a production server running (pnpm build && PORT=3212 pnpm start):
//   BASE_URL=http://localhost:3212 node scripts/make-og.mjs
//   pnpm remove playwright   # keep the repo lean; og.png is the committed artifact
import { chromium } from "playwright";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const BASE = process.env.BASE_URL ?? "http://localhost:3212";
const here = dirname(fileURLToPath(import.meta.url));
const out = resolve(here, "..", "public", "og.png");

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });

await page.goto(`${BASE}/og`, { waitUntil: "networkidle" });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(400);
await page.locator("#og-card").screenshot({ path: out });

// Also capture the hero scene for visual review (not committed).
await page.setViewportSize({ width: 1280, height: 900 });
await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(400);
await page.locator(".lp-screen").screenshot({ path: "/tmp/hero-check.png" });

await browser.close();
console.log(`wrote ${out} and /tmp/hero-check.png`);
