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

/** A buyable car and a sold one, for the two detail-page states. */
const DETAIL = "/cars/toyota-corolla-altis-grande-2021";
const SOLD = "/cars/honda-city-aspire-2019";

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
  /* The closing CTA band, where the sell button now carries the red. */
  { name: "desktop-cta-band", url: "/cars", width: 1440, height: 900, anchor: "bottom" },
  { name: "mobile-cta-band", url: "/cars", width: 375, height: 812, anchor: "bottom" },
  /* The homepage hero, where the Sell CTA is now a filled signal button
     sitting directly beside the filled cobalt Browse button. */
  { name: "home-hero-desktop", url: "/", width: 1440, height: 900, scrollY: 0 },
  { name: "home-hero-mobile", url: "/", width: 375, height: 812, scrollY: 0 },
  /* Vehicle detail page (Phase 3). */
  { name: "detail-desktop-top", url: DETAIL, width: 1440, height: 900, scrollY: 0 },
  { name: "detail-desktop-specs", url: DETAIL, width: 1440, height: 900, scrollY: 620 },
  { name: "detail-desktop-similar", url: DETAIL, width: 1440, height: 900, scrollY: 1500 },
  { name: "detail-laptop-top", url: DETAIL, width: 1024, height: 768, scrollY: 0 },
  { name: "detail-mobile-top", url: DETAIL, width: 375, height: 812, scrollY: 0 },
  { name: "detail-mobile-panel", url: DETAIL, width: 375, height: 812, scrollY: 560 },
  { name: "detail-sold-desktop", url: SOLD, width: 1440, height: 900, scrollY: 0 },
  /* Portrait sources (0.67 ratio) against a 16:10 gallery — the crop check. */
  { name: "detail-portrait-prado", url: "/cars/toyota-land-cruiser-prado-tx-2017", width: 1440, height: 900, scrollY: 0 },
  { name: "detail-portrait-hilux", url: "/cars/toyota-hilux-revo-2020", width: 1440, height: 900, scrollY: 0 },
  { name: "detail-notfound", url: "/cars/not-a-real-car", width: 1440, height: 900, scrollY: 0 },
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
  } else if (shot.anchor === "bottom") {
    /* Land the closing CTA band in the middle of the viewport.
       globals.css sets `scroll-behavior: smooth`, so the scroll has to be
       forced instant or the screenshot catches it mid-animation. */
    await page.evaluate(() => {
      document.documentElement.style.scrollBehavior = "auto";
      const heading = [...document.querySelectorAll("h2")].find((el) =>
        /looking for something specific/i.test(el.textContent ?? ""),
      );
      const section = heading?.closest("section");
      if (section) {
        const top = section.getBoundingClientRect().top + window.scrollY;
        window.scrollTo(0, Math.max(0, top - 140));
      }
    });
    await page.waitForTimeout(400);
  } else if (shot.scrollY) {
    await page.evaluate((y) => {
      document.documentElement.style.scrollBehavior = "auto";
      window.scrollTo(0, y);
    }, shot.scrollY);
    await page.waitForTimeout(250);
  }

  await page.screenshot({ path: path.join(OUT, `${shot.name}.png`) });
  console.log(`captured ${shot.name} (${shot.width}x${shot.height})`);
}

await browser.close();
