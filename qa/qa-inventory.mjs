/**
 * ZK Motors — Phase 2 QA harness.
 *
 * Drives the real built site in Microsoft Edge via playwright-core and checks
 * the things that are easy to get wrong and invisible in a screenshot:
 *   - console errors on every route
 *   - horizontal overflow at each viewport
 *   - that the rendered result count actually matches the filter in the URL
 *   - that filtering is a real navigation (back button works)
 *   - that the mobile filter sheet fills the viewport, which is the specific
 *     failure mode when a `backdrop-filter` ancestor captures `position: fixed`
 *
 * Usage:
 *   NODE_PATH=<workspace>/node_modules node qa/qa-inventory.mjs <baseUrl> [outDir]
 */

import { mkdir } from "node:fs/promises";
import path from "node:path";

import { chromium } from "playwright-core";

const BASE = (process.argv[2] ?? "http://localhost:3000").replace(/\/$/, "");
const OUT = path.resolve(process.argv[3] ?? "screenshots/inventory");

const VIEWPORTS = [
  { name: "mobile-375", width: 375, height: 812 },
  { name: "mobile-414", width: 414, height: 896 },
  { name: "tablet-768", width: 768, height: 1024 },
  { name: "laptop-1024", width: 1024, height: 768 },
  { name: "desktop-1440", width: 1440, height: 900 },
];

const TOTAL = 14;

/* Filter permutations and the number of cards each must render. Derived by
   hand from src/data/vehicles.ts — if the dataset changes, these change. */
const COUNT_CASES = [
  { query: "", expect: 10, note: "default = available + reserved, sold hidden" },
  { query: "?status=all", expect: 14, note: "every vehicle" },
  { query: "?status=sold", expect: 4, note: "sold only" },
  { query: "?make=Toyota", expect: 3, note: "Toyota, sold excluded" },
  { query: "?make=Toyota&status=all", expect: 4, note: "Toyota incl. the sold Hilux" },
  { query: "?make=BMW", expect: 0, note: "BMW only has a sold car -> empty state" },
  { query: "?bodyType=SUV", expect: 5, note: "SUV body type" },
  { query: "?transmission=Manual", expect: 1, note: "manual only" },
  { query: "?year=2019", expect: 2, note: "exact year from the homepage quick-search" },
  { query: "?maxPrice=4000000", expect: 1, note: "budget ceiling" },
  { query: "?minPrice=5000000&maxPrice=4000000", expect: 2, note: "reversed range is swapped to 4m-5m, not zeroed" },
  { query: "?make=Nonsense", expect: 10, note: "unknown make dropped, not passed through" },
];

let failures = 0;
let checks = 0;

function check(ok, label, detail = "") {
  checks += 1;
  if (ok) {
    console.log(`  PASS  ${label}`);
  } else {
    failures += 1;
    console.log(`  FAIL  ${label}${detail ? ` — ${detail}` : ""}`);
  }
}

/** Read the "Showing N of 14 cars" line out of the sticky toolbar. */
async function readCount(page) {
  const text = await page.locator('[aria-live="polite"]').first().innerText();
  const match = text.match(/Showing\s+([\d,]+)\s+of\s+([\d,]+)/i);
  if (match) return { shown: Number(match[1].replace(/,/g, "")), total: Number(match[2]) };
  return { shown: -1, total: -1 };
}

/**
 * Wait for the toolbar to report a specific count.
 *
 * `waitForURL` only tells us the address bar changed; the server round trip and
 * the React commit can still be in flight. Reading the count immediately after
 * a back navigation is a race, so poll for the settled value and let the
 * timeout be the failure.
 */
async function waitForCount(page, expected, timeout = 5000) {
  try {
    await page.waitForFunction(
      (want) => {
        const el = document.querySelector('[aria-live="polite"]');
        if (!el) return false;
        const match = (el.textContent ?? "").match(/Showing\s+([\d,]+)/i);
        return match ? Number(match[1].replace(/,/g, "")) === want : false;
      },
      expected,
      { timeout },
    );
    return true;
  } catch {
    return false;
  }
}

async function overflow(page) {
  return page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
  }));
}

async function run() {
  await mkdir(OUT, { recursive: true });

  const browser = await chromium.launch({ channel: "msedge", headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const consoleErrors = [];
  const pageErrors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(`${page.url()} :: ${msg.text()}`);
  });
  page.on("pageerror", (err) => pageErrors.push(`${page.url()} :: ${err.message}`));

  /* ------------------------------------------------------------------ */
  console.log("\n== Result counts match the filter in the URL ==");
  for (const testCase of COUNT_CASES) {
    await page.goto(`${BASE}/cars${testCase.query}`, { waitUntil: "networkidle" });
    const { shown, total } = await readCount(page);
    const cards = await page.locator("article").count();
    check(
      shown === testCase.expect && cards === testCase.expect,
      `${testCase.query || "(no query)"} -> ${testCase.expect} cars`,
      `toolbar said ${shown}, DOM had ${cards}. ${testCase.note}`,
    );
    if (total !== TOTAL) {
      check(false, `  total reported as ${TOTAL}`, `got ${total}`);
    }
  }

  /* ------------------------------------------------------------------ */
  console.log("\n== Header figures describe buyable stock ==");
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${BASE}/cars`, { waitUntil: "networkidle" });
  const stats = (
    await page.locator("main section").first().locator("dl").innerText()
  ).replace(/\s+/g, " ");
  /* innerText reflects `text-transform: uppercase` from the eyebrow style, so
     these have to be matched case-insensitively. */
  check(
    /available now 10/i.test(stats),
    "header count excludes the 4 sold cars",
    stats,
  );
  check(
    /from pkr 3,650,000/i.test(stats),
    "header 'from' is the cheapest buyable price and carries its currency",
    stats,
  );

  /* ------------------------------------------------------------------ */
  console.log("\n== Empty state ==");
  await page.goto(`${BASE}/cars?make=BMW`, { waitUntil: "networkidle" });
  const emptyHeading = page.getByRole("heading", { name: /no cars match/i });
  check(await emptyHeading.isVisible(), "empty state heading is shown");
  check((await page.locator("article").count()) === 0, "no vehicle cards rendered");
  const clearAll = page.getByRole("link", { name: /clear all filters/i });
  check(await clearAll.isVisible(), "empty state offers a way out");
  await page.screenshot({ path: path.join(OUT, "state-empty.png"), fullPage: true });

  /* ------------------------------------------------------------------ */
  console.log("\n== Filtering is a real navigation ==");
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${BASE}/cars`, { waitUntil: "networkidle" });
  const before = (await readCount(page)).shown;
  check(before === 10, "unfiltered list starts at 10", `got ${before}`);

  /* A pill is a plain link, so this is an ordinary navigation. */
  await page.getByRole("link", { name: "SUV", exact: true }).first().click();
  await page.waitForURL(/bodyType=SUV/);
  const afterPill = (await readCount(page)).shown;
  check(afterPill === 5, "clicking a body-type pill filters the list", `${before} -> ${afterPill}`);

  await page.goBack();
  await page.waitForURL((url) => !url.search.includes("bodyType="));
  const backSettled = await waitForCount(page, before);
  const restored = (await readCount(page)).shown;
  check(
    backSettled && restored === before,
    "back button restores the previous filter state",
    `got ${restored}, expected ${before}`,
  );

  /* The make control is a native select that pushes on change. */
  const sidebar = page.getByRole("complementary", { name: /filter cars/i });
  await sidebar.getByLabel("Make", { exact: true }).selectOption("Toyota");
  await page.waitForURL(/make=Toyota/);
  const afterSelect = (await readCount(page)).shown;
  check(afterSelect === 3, "make select filters the list", `got ${afterSelect}`);

  /* Changing make must clear a model that belongs to the old make. */
  await sidebar.getByLabel("Model", { exact: true }).selectOption("Corolla");
  await page.waitForURL(/model=Corolla/);
  await sidebar.getByLabel("Make", { exact: true }).selectOption("Honda");
  await page.waitForURL(/make=Honda/);
  check(
    !new URL(page.url()).search.includes("model="),
    "changing make clears the stale model",
    page.url(),
  );

  /* Chip removal */
  await page.goto(`${BASE}/cars?make=Toyota&bodyType=SUV`, { waitUntil: "networkidle" });
  const chips = await page.getByRole("link", { name: /^Remove filter:/ }).count();
  check(chips === 2, "one chip per active filter group", `got ${chips}`);
  await page.getByRole("link", { name: /Remove filter: Toyota/ }).click();
  await page.waitForURL((url) => !url.search.includes("make="));
  check(
    new URL(page.url()).search.includes("bodyType=SUV"),
    "removing one chip keeps the others",
    page.url(),
  );

  /* Price and year ranges collapse to a single chip */
  await page.goto(`${BASE}/cars?minPrice=4000000&maxPrice=8000000&minYear=2018&maxYear=2021`, {
    waitUntil: "networkidle",
  });
  const rangeChips = await page.getByRole("link", { name: /^Remove filter:/ }).count();
  check(rangeChips === 2, "price and year each collapse to one chip", `got ${rangeChips}`);

  /* Canonical stays clean regardless of filters. metadataBase is set, so Next
     emits an absolute URL on the production domain — assert the path and the
     absence of a query string rather than the literal string. */
  const canonical = await page.locator('link[rel="canonical"]').getAttribute("href");
  const canonicalUrl = canonical ? new URL(canonical, BASE) : null;
  check(
    canonicalUrl !== null &&
      canonicalUrl.pathname === "/cars" &&
      canonicalUrl.search === "",
    "filtered page canonicalises to /cars with no query string",
    String(canonical),
  );

  /* ------------------------------------------------------------------ */
  console.log("\n== Sorting ==");
  await page.goto(`${BASE}/cars?sort=price-asc`, { waitUntil: "networkidle" });
  const cheapest = await page.locator("article").first().innerText();
  check(/3,650,000/.test(cheapest), "price ascending puts the cheapest first", cheapest.split("\n")[0]);

  await page.goto(`${BASE}/cars?sort=price-desc&status=all`, { waitUntil: "networkidle" });
  const dearest = await page.locator("article").first().innerText();
  check(/24,500,000/.test(dearest), "price descending puts the dearest first", dearest.split("\n")[0]);

  await page.goto(`${BASE}/cars?sort=mileage-asc&status=all`, { waitUntil: "networkidle" });
  const lowestMileage = await page.locator("article").first().innerText();
  check(/28,000 km/.test(lowestMileage), "lowest mileage sorts correctly", lowestMileage.split("\n")[0]);

  /* ------------------------------------------------------------------ */
  console.log("\n== Responsive ==");
  for (const viewport of VIEWPORTS) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto(`${BASE}/cars`, { waitUntil: "networkidle" });

    const { scrollWidth, innerWidth } = await overflow(page);
    check(
      scrollWidth <= innerWidth + 1,
      `${viewport.name}: no horizontal overflow`,
      `scrollWidth ${scrollWidth} vs innerWidth ${innerWidth}`,
    );

    await page.screenshot({
      path: path.join(OUT, `${viewport.name}-full.png`),
      fullPage: true,
    });
  }

  /* ------------------------------------------------------------------ */
  console.log("\n== Mobile filter sheet ==");
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto(`${BASE}/cars`, { waitUntil: "networkidle" });

  const sidebarVisible = await page
    .getByRole("complementary", { name: /filter cars/i })
    .isVisible()
    .catch(() => false);
  check(!sidebarVisible, "sidebar is not shown on mobile");

  await page.getByRole("button", { name: /filters/i }).click();
  const dialog = page.getByRole("dialog", { name: /filter vehicles/i });
  await dialog.waitFor({ state: "visible" });

  /* The backdrop-filter containing-block trap: if an ancestor has
     backdrop-filter, this panel would be clipped to a bar instead of the
     viewport. Measure it rather than eyeballing the screenshot. */
  const box = await dialog.boundingBox();
  check(
    box !== null && box.height >= 812 - 2,
    "sheet fills the viewport height",
    box ? `height ${Math.round(box.height)}px` : "no box",
  );

  const scrim = page.locator("#inventory-filters").locator("xpath=preceding-sibling::div[1]");
  const scrimBox = await scrim.boundingBox();
  check(
    scrimBox !== null && scrimBox.width >= 375 - 2,
    "scrim covers the viewport width",
    scrimBox ? `width ${Math.round(scrimBox.width)}px` : "no box",
  );

  await page.screenshot({ path: path.join(OUT, "state-mobile-sheet.png") });

  /* Filters apply live from inside the sheet */
  await dialog.getByRole("link", { name: "SUV", exact: true }).first().click();
  await page.waitForURL(/bodyType=SUV/);
  await page.waitForTimeout(400);
  const footerButton = dialog.getByRole("button", { name: /show \d+ cars?/i });
  const footerText = await footerButton.innerText();
  check(/show 5 cars/i.test(footerText), "sheet footer count updates live", footerText);

  await footerButton.click();
  await dialog.waitFor({ state: "hidden" });
  check(true, "sheet closes");

  const bodyOverflow = await page.evaluate(() => document.body.style.overflow);
  check(bodyOverflow !== "hidden", "background scroll is restored after closing", `overflow="${bodyOverflow}"`);

  /* ------------------------------------------------------------------ */
  console.log("\n== Homepage regression ==");
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
  const featured = await page.locator("article").count();
  check(featured > 0, "homepage still renders vehicle cards", `${featured} cards`);
  const homeOverflow = await overflow(page);
  check(
    homeOverflow.scrollWidth <= homeOverflow.innerWidth + 1,
    "homepage has no horizontal overflow",
  );

  /* ------------------------------------------------------------------ */
  console.log("\n== Console ==");
  /* Next dev/start logs a 404 for a missing favicon route; ignore that. */
  const realConsoleErrors = consoleErrors.filter((line) => !/favicon/i.test(line));
  check(
    realConsoleErrors.length === 0,
    "no console errors across the run",
    realConsoleErrors.slice(0, 6).join(" | "),
  );
  check(pageErrors.length === 0, "no uncaught page errors", pageErrors.slice(0, 4).join(" | "));

  await browser.close();

  console.log(`\n${checks - failures}/${checks} checks passed.`);
  if (failures > 0) {
    console.log(`${failures} FAILED.`);
    process.exit(1);
  }
  console.log("All checks passed.");
}

run().catch((error) => {
  console.error("\nHarness crashed:", error);
  process.exit(1);
});
