/**
 * Measure the real contrast of a status badge against the photograph behind it.
 *
 * The badge is translucent, so its backdrop is whatever part of the car photo
 * happens to sit underneath — which this codebase cannot control and cannot
 * check from the CSS alone. This clips a screenshot to the badge's actual
 * bounding box (located from the DOM, not eyeballed) and hands the crop to
 * `scripts/measure_badge_contrast.py`.
 *
 * Usage: node qa/measure-badge.mjs <baseUrl> <vehicleId> <outPng>
 */
import path from "node:path";

import { chromium } from "playwright-core";

const BASE = (process.argv[2] ?? "http://localhost:3000").replace(/\/$/, "");
const ID = process.argv[3] ?? "toyota-land-cruiser-prado-tx-2017";
const OUT = path.resolve(process.argv[4] ?? "screenshots/inspect/badge-crop.png");

const browser = await chromium.launch({ channel: "msedge", headless: true });
const page = await browser.newPage();
await page.setViewportSize({ width: 1440, height: 900 });
await page.goto(`${BASE}/cars/${ID}`, { waitUntil: "networkidle" });

/* The badge is the only element in the main column whose text is exactly one of
   the three status labels. Matching on the DOM beats guessing pixel offsets. */
const badge = page
  .locator("main span")
  .filter({ hasText: /^(Available|Reserved|Sold)$/ })
  .first();

const box = await badge.boundingBox();
if (!box) throw new Error("badge not found");

console.log(`badge box: x=${box.x} y=${box.y} w=${box.width} h=${box.height}`);
console.log(`computed:  ${JSON.stringify(await badge.evaluate((el) => {
  const cs = getComputedStyle(el);
  return { color: cs.color, background: cs.backgroundColor, fontSize: cs.fontSize };
}))}`);

await page.screenshot({ path: OUT, clip: box });
console.log(`wrote ${OUT}`);

await browser.close();
