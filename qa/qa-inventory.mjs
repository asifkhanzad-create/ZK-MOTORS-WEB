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
 *   node --env-file=.env.local qa/qa-inventory.mjs <baseUrl> [outDir]
 *
 * It needs the Supabase environment variables because it reads the live stock to
 * work out how many cars each filter should return — see "Expected counts" below.
 */

import { mkdir } from "node:fs/promises";
import path from "node:path";

import { createClient } from "@supabase/supabase-js";
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

/* --------------------------------------------------------------------------
   Expected counts, derived from the live stock
   --------------------------------------------------------------------------
   These used to be literals — "14 cars total, 10 buyable, Toyota 3, SUV 5" —
   derived by hand from a frozen dataset. That was fine while the dataset was
   frozen, and it stopped being fine the moment the client added a car through
   the dashboard: the harness went red on 24 checks and every one of them was
   the harness being out of date, not the site being wrong. A test suite that
   fails when someone uses the product is worse than no suite, because the next
   real failure arrives buried in noise.

   So the numbers are computed here from the same rows the site reads. The
   predicates are written out rather than imported from `src/lib/facets.ts` on
   purpose: re-importing the app's own filter engine would compare the app to
   itself and pass no matter what it did. Two independent implementations
   agreeing is the actual evidence.

   `status=available` in the UI means "not sold" — it covers available and
   reserved, and is the default. `status=all` includes sold cars.
   -------------------------------------------------------------------------- */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error(
    "\n  Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY.\n\n" +
      "  This harness reads the live stock to derive how many cars each filter\n" +
      "  should return, so it needs the same variables the site uses:\n\n" +
      "      node --env-file=.env.local qa/qa-inventory.mjs http://localhost:3000\n",
  );
  process.exit(2);
}

const { data: ROWS, error: rowsError } = await createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})
  .from("vehicles")
  .select("*");

if (rowsError || !Array.isArray(ROWS)) {
  console.error(`\n  Could not read stock: ${rowsError?.message ?? "unexpected response"}\n`);
  process.exit(2);
}
if (ROWS.length === 0) {
  console.error("\n  The vehicles table is empty — nothing to assert against.\n");
  process.exit(2);
}

const buyable = ROWS.filter((row) => row.status !== "sold");
const sold = ROWS.filter((row) => row.status === "sold");
const pkr = (amount) => `PKR ${new Intl.NumberFormat("en-US").format(amount)}`;

/* `Math.min(...[])` is `Infinity`, and `Infinity` formats as "PKR Infinity" —
   the same trap `getPriceBounds` guards against. Fail loudly instead of
   asserting on a nonsense string. */
if (buyable.length === 0) {
  console.error("\n  No buyable cars — the price bounds cannot be derived.\n");
  process.exit(2);
}

/* A query guaranteed to return nothing, for the empty-state test.
   Prefer a make whose cars are all sold — that is how an empty result actually
   happens in this catalogue, and it exercises the make filter. If every make has
   buyable stock, fall back to a price floor one rupee above the dearest car,
   which cannot match by construction. Either way it is derived, so adding stock
   cannot make the empty-state test assert the wrong thing. */
const allSoldMake = [...new Set(ROWS.map((row) => row.make))].find(
  (make) => !buyable.some((row) => row.make === make),
);
const emptyQuery = allSoldMake
  ? `?make=${encodeURIComponent(allSoldMake)}`
  : `?minPrice=${Math.max(...ROWS.map((row) => row.price)) + 1}`;

const EXPECT = {
  emptyQuery,
  total: ROWS.length,
  buyable: buyable.length,
  sold: sold.length,
  toyotaBuyable: buyable.filter((row) => row.make === "Toyota").length,
  toyotaAll: ROWS.filter((row) => row.make === "Toyota").length,
  suvBuyable: buyable.filter((row) => row.body_type === "SUV").length,
  manualBuyable: buyable.filter((row) => row.transmission === "Manual").length,
  year2019Buyable: buyable.filter((row) => row.year === 2019).length,
  under4mBuyable: buyable.filter((row) => row.price <= 4_000_000).length,
  range4to5mBuyable: buyable.filter((row) => row.price >= 4_000_000 && row.price <= 5_000_000)
    .length,
  cheapestBuyable: pkr(Math.min(...buyable.map((row) => row.price))),
  dearestAll: pkr(Math.max(...ROWS.map((row) => row.price))),
  lowestMileageAll: `${new Intl.NumberFormat("en-US").format(
    Math.min(...ROWS.map((row) => row.mileage)),
  )} km`,
};

const TOTAL = EXPECT.total;

/** Escape a derived string so it can be used as a literal inside a RegExp. */
const escapeRe = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const COUNT_CASES = [
  { query: "", expect: EXPECT.buyable, note: "default = available + reserved, sold hidden" },
  { query: "?status=all", expect: EXPECT.total, note: "every vehicle" },
  { query: "?status=sold", expect: EXPECT.sold, note: "sold only" },
  { query: "?make=Toyota", expect: EXPECT.toyotaBuyable, note: "Toyota, sold excluded" },
  { query: "?make=Toyota&status=all", expect: EXPECT.toyotaAll, note: "Toyota incl. sold" },
  {
    /* Was hard-coded to BMW, on the assumption that its only car stays sold.
       Derived instead: assert the empty state against a make that currently has
       only sold stock, and fall back to a make that does have stock. */
    query: allSoldMake
      ? `?make=${encodeURIComponent(allSoldMake)}`
      : `?make=${encodeURIComponent(ROWS[0].make)}`,
    expect: allSoldMake
      ? 0
      : buyable.filter((row) => row.make === ROWS[0].make).length,
    note: allSoldMake
      ? `${allSoldMake} has only sold stock -> empty state`
      : `${ROWS[0].make}, buyable only`,
  },
  { query: "?bodyType=SUV", expect: EXPECT.suvBuyable, note: "SUV body type" },
  { query: "?transmission=Manual", expect: EXPECT.manualBuyable, note: "manual only" },
  { query: "?year=2019", expect: EXPECT.year2019Buyable, note: "exact year from quick-search" },
  { query: "?maxPrice=4000000", expect: EXPECT.under4mBuyable, note: "budget ceiling" },
  {
    query: "?minPrice=5000000&maxPrice=4000000",
    expect: EXPECT.range4to5mBuyable,
    note: "reversed range is swapped to 4m-5m, not zeroed",
  },
  {
    query: "?make=Nonsense",
    expect: EXPECT.buyable,
    note: "unknown make dropped, not passed through",
  },
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
    await page.goto(`${BASE}/cars${testCase.query}`, { waitUntil: "load" });
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
  await page.goto(`${BASE}/cars`, { waitUntil: "load" });
  const stats = (
    await page.locator("main section").first().locator("dl").innerText()
  ).replace(/\s+/g, " ");
  /* innerText reflects `text-transform: uppercase` from the eyebrow style, so
     these have to be matched case-insensitively. */
  check(
    new RegExp(`available now ${EXPECT.buyable}\\b`, "i").test(stats),
    `header count excludes the ${EXPECT.sold} sold cars`,
    stats,
  );
  check(
    new RegExp(escapeRe(EXPECT.cheapestBuyable), "i").test(stats),
    "header 'from' is the cheapest buyable price and carries its currency",
    stats,
  );

  /* ------------------------------------------------------------------ */
  console.log("\n== Empty state ==");
  await page.goto(`${BASE}/cars${EXPECT.emptyQuery}`, { waitUntil: "load" });
  const emptyHeading = page.getByRole("heading", { name: /no cars match/i });
  check(await emptyHeading.isVisible(), "empty state heading is shown", EXPECT.emptyQuery);
  check(
    (await page.locator("article").count()) === 0,
    "no vehicle cards rendered",
    EXPECT.emptyQuery,
  );
  const clearAll = page.getByRole("link", { name: /clear all filters/i });
  check(await clearAll.isVisible(), "empty state offers a way out");
  await page.screenshot({ path: path.join(OUT, "state-empty.png"), fullPage: true });

  /* ------------------------------------------------------------------ */
  console.log("\n== Filtering is a real navigation ==");
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${BASE}/cars`, { waitUntil: "load" });
  const before = (await readCount(page)).shown;
  check(before === EXPECT.buyable, `unfiltered list starts at ${EXPECT.buyable}`, `got ${before}`);

  /* A pill is a plain link, so this is an ordinary navigation. */
  await page.getByRole("link", { name: "SUV", exact: true }).first().click();
  await page.waitForURL(/bodyType=SUV/);
  const afterPill = (await readCount(page)).shown;
  check(
    afterPill === EXPECT.suvBuyable,
    "clicking a body-type pill filters the list",
    `${before} -> ${afterPill}, expected ${EXPECT.suvBuyable}`,
  );

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
  check(
    afterSelect === EXPECT.toyotaBuyable,
    "make select filters the list",
    `got ${afterSelect}, expected ${EXPECT.toyotaBuyable}`,
  );

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
  await page.goto(`${BASE}/cars?make=Toyota&bodyType=SUV`, { waitUntil: "load" });
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
    waitUntil: "load",
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
  await page.goto(`${BASE}/cars?sort=price-asc`, { waitUntil: "load" });
  const cheapest = await page.locator("article").first().innerText();
  check(
    cheapest.includes(EXPECT.cheapestBuyable),
    "price ascending puts the cheapest first",
    `${EXPECT.cheapestBuyable} — ${cheapest.split("\n")[0]}`,
  );

  await page.goto(`${BASE}/cars?sort=price-desc&status=all`, { waitUntil: "load" });
  const dearest = await page.locator("article").first().innerText();
  check(
    dearest.includes(EXPECT.dearestAll),
    "price descending puts the dearest first",
    `${EXPECT.dearestAll} — ${dearest.split("\n")[0]}`,
  );

  await page.goto(`${BASE}/cars?sort=mileage-asc&status=all`, { waitUntil: "load" });
  const lowestMileage = await page.locator("article").first().innerText();
  check(
    lowestMileage.includes(EXPECT.lowestMileageAll),
    "lowest mileage sorts correctly",
    `${EXPECT.lowestMileageAll} — ${lowestMileage.split("\n")[0]}`,
  );

  /* ------------------------------------------------------------------ */
  console.log("\n== Responsive ==");
  for (const viewport of VIEWPORTS) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto(`${BASE}/cars`, { waitUntil: "load" });

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
  await page.goto(`${BASE}/cars`, { waitUntil: "load" });

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
  check(
    new RegExp(`show ${EXPECT.suvBuyable} cars?`, "i").test(footerText),
    "sheet footer count updates live",
    `${footerText} (expected ${EXPECT.suvBuyable})`,
  );

  await footerButton.click();
  await dialog.waitFor({ state: "hidden" });
  check(true, "sheet closes");

  const bodyOverflow = await page.evaluate(() => document.body.style.overflow);
  check(bodyOverflow !== "hidden", "background scroll is restored after closing", `overflow="${bodyOverflow}"`);

  /* ------------------------------------------------------------------ */
  console.log("\n== Homepage regression ==");
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${BASE}/`, { waitUntil: "load" });
  const featured = await page.locator("article").count();
  check(featured > 0, "homepage still renders vehicle cards", `${featured} cards`);
  const homeOverflow = await overflow(page);
  check(
    homeOverflow.scrollWidth <= homeOverflow.innerWidth + 1,
    "homepage has no horizontal overflow",
  );

  /* The client asked twice for the selling path to be filled red rather than an
     outline — first the /cars closing band, then the hero. Pin the hero's one
     down, because "it should look red" is a stated requirement that nothing else
     in this file would catch if a refactor reverted it.
     Read computed style rather than class names: the base classes contain
     `transition-[...,border-color,...]`, so a naive /border/ match on the class
     string reports an outline that is not there. */
  const heroSell = page.locator('section a[href="/sell-your-car"]').first();
  const heroSellStyle = await heroSell.evaluate((el) => {
    const cs = getComputedStyle(el);
    return { bg: cs.backgroundColor, fg: cs.color, border: cs.borderTopWidth };
  });
  check(
    heroSellStyle.bg === "rgb(201, 68, 56)",
    "hero Sell CTA is filled with signal-500",
    heroSellStyle.bg,
  );
  check(
    heroSellStyle.fg === "rgb(255, 255, 255)",
    "hero Sell CTA label is white",
    heroSellStyle.fg,
  );
  check(
    heroSellStyle.border === "0px",
    "hero Sell CTA is filled, not outlined",
    heroSellStyle.border,
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
