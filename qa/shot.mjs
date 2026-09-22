/**
 * Ad-hoc visual inspection: viewport-sized captures of specific states so the
 * design can actually be judged at readable scale.
 *
 * Usage: node qa/shot.mjs <baseUrl> <outDir>
 */
import { mkdir } from "node:fs/promises";
import path from "node:path";

import { chromium } from "playwright-core";

const BASE = (process.argv[2] ?? "http://localhost:3000").replace(/\/$/, "");
const OUT = path.resolve(process.argv[3] ?? "screenshots/inspect");

const SHOTS = [
  { name: "mobile-top", url: "/cars", width: 375, height: 812, scrollY: 0 },
  { name: "mobile-toolbar", url: "/cars", width: 375, height: 812, scrollY: 250 },
  { name: "mobile-card", url: "/cars", width: 375, height: 812, scrollY: 330 },
  { name: "desktop-top", url: "/cars", width: 1440, height: 900, scrollY: 0 },
  { name: "desktop-grid", url: "/cars", width: 1440, height: 900, scrollY: 420 },
  { name: "desktop-filtered", url: "/cars?make=Toyota&status=all", width: 1440, height: 900, scrollY: 0 },
  { name: "desktop-sold", url: "/cars?status=sold", width: 1440, height: 900, scrollY: 0 },
  { name: "laptop-top", url: "/cars", width: 1024, height: 768, scrollY: 0 },
  { name: "tablet-top", url: "/cars", width: 768, height: 1024, scrollY: 0 },
  /* The status pills sit at the bottom of the sheet, past the fold. */
  { name: "mobile-sheet-top", url: "/cars", width: 375, height: 812, openSheet: true },
  { name: "mobile-sheet-bottom", url: "/cars", width: 375, height: 812, openSheet: true, sheetScroll: 9999 },
];

await mkdir(OUT, { recursive: true });
const browser = await chromium.launch({ channel: "msedge", headless: true });
const page = await browser.newPage();

for (const shot of SHOTS) {
  await page.setViewportSize({ width: shot.width, height: shot.height });
  await page.goto(`${BASE}${shot.url}`, { waitUntil: "networkidle" });

  if (shot.openSheet) {
    await page.getByRole("button", { name: /filters/i }).click();
    await page.getByRole("dialog", { name: /filter vehicles/i }).waitFor({ state: "visible" });
    if (shot.sheetScroll) {
      await page.evaluate((y) => {
        const scroller = document.querySelector("#inventory-filters .overflow-y-auto");
        if (scroller) scroller.scrollTop = y;
      }, shot.sheetScroll);
    }
    await page.waitForTimeout(300);
  } else if (shot.scrollY) {
    await page.evaluate((y) => window.scrollTo(0, y), shot.scrollY);
    await page.waitForTimeout(250);
  }

  await page.screenshot({ path: path.join(OUT, `${shot.name}.png`) });
  console.log(`captured ${shot.name} (${shot.width}x${shot.height})`);
}

await browser.close();
