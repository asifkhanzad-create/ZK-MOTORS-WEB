/**
 * ZK Motors — Phase 3 QA harness (vehicle detail pages).
 *
 * The expectations below are transcribed from `src/data/vehicles.ts` rather
 * than read from it. That is deliberate: a harness that imports the same data
 * the page imports can only ever prove the page renders *something*. These
 * numbers are an independent statement of what the page must show.
 *
 * Checks the things a screenshot cannot:
 *   - every listing resolves, and an unknown slug 404s rather than rendering
 *   - the spec table agrees with the record
 *   - structured data says the same thing as the visible page
 *   - the enquiry panel never offers to sell you a car that is already sold
 *   - similar-car suggestions are never sold cars, and never the car you are on
 *   - the sticky panel still fits a short laptop viewport
 *   - no card on /cars links to a route that does not exist
 *
 * Usage: node qa/qa-detail.mjs <baseUrl> [outDir]
 */

import { mkdir } from "node:fs/promises";
import path from "node:path";

import { chromium } from "playwright-core";

const BASE = (process.argv[2] ?? "http://localhost:3000").replace(/\/$/, "");
const OUT = path.resolve(process.argv[3] ?? "screenshots/detail");

const VIEWPORTS = [
  { name: "mobile-375", width: 375, height: 812 },
  { name: "mobile-414", width: 414, height: 896 },
  { name: "tablet-768", width: 768, height: 1024 },
  { name: "laptop-1024", width: 1024, height: 768 },
  { name: "desktop-1440", width: 1440, height: 900 },
];

/* --------------------------------------------------------------------------
   Expected inventory — transcribed by hand from src/data/vehicles.ts.
   -------------------------------------------------------------------------- */
const VEHICLES = [
  { id: "toyota-corolla-altis-grande-2021", make: "Toyota", model: "Corolla", variant: "Altis Grande 1.8", year: 2021, price: 8_650_000, mileage: 42_000, transmission: "Automatic", fuel: "Petrol", bodyType: "Sedan", city: "Islamabad", status: "available" },
  { id: "honda-civic-oriel-2022", make: "Honda", model: "Civic", variant: "Oriel", year: 2022, price: 10_400_000, mileage: 31_000, transmission: "Automatic", fuel: "Petrol", bodyType: "Sedan", city: "Rawalpindi", status: "available" },
  { id: "toyota-fortuner-sigma-4-2019", make: "Toyota", model: "Fortuner", variant: "Sigma 4", year: 2019, price: 16_750_000, mileage: 78_000, transmission: "Automatic", fuel: "Diesel", bodyType: "SUV", city: "Islamabad", status: "available" },
  { id: "toyota-land-cruiser-prado-tx-2017", make: "Toyota", model: "Land Cruiser Prado", variant: "TX", year: 2017, price: 24_500_000, mileage: 96_000, transmission: "Automatic", fuel: "Petrol", bodyType: "SUV", city: "Islamabad", status: "available" },
  { id: "suzuki-swift-glx-2020", make: "Suzuki", model: "Swift", variant: "GLX CVT", year: 2020, price: 4_150_000, mileage: 55_000, transmission: "Automatic", fuel: "Petrol", bodyType: "Hatchback", city: "Wah Cantt", status: "available" },
  { id: "kia-picanto-2021", make: "Kia", model: "Picanto", variant: "1.0 A/T", year: 2021, price: 3_650_000, mileage: 38_000, transmission: "Automatic", fuel: "Petrol", bodyType: "Hatchback", city: "Rawalpindi", status: "reserved" },
  { id: "suzuki-ciaz-glx-2019", make: "Suzuki", model: "Ciaz", variant: "1.4 GLX", year: 2019, price: 4_850_000, mileage: 62_000, transmission: "Automatic", fuel: "Petrol", bodyType: "Sedan", city: "Islamabad", status: "available" },
  { id: "suzuki-jimny-glx-2021", make: "Suzuki", model: "Jimny", variant: "1.5 GLX", year: 2021, price: 8_200_000, mileage: 28_000, transmission: "Automatic", fuel: "Petrol", bodyType: "SUV", city: "Islamabad", status: "available" },
  { id: "suzuki-vitara-gl-plus-2018", make: "Suzuki", model: "Vitara", variant: "1.6 GL+", year: 2018, price: 6_400_000, mileage: 71_000, transmission: "Automatic", fuel: "Petrol", bodyType: "SUV", city: "Rawalpindi", status: "available" },
  { id: "suzuki-grand-vitara-2015", make: "Suzuki", model: "Grand Vitara", variant: "2.4", year: 2015, price: 5_300_000, mileage: 118_000, transmission: "Manual", fuel: "Petrol", bodyType: "SUV", city: "Taxila", status: "available" },
  { id: "honda-city-aspire-2019", make: "Honda", model: "City", variant: "1.5 Aspire", year: 2019, price: 6_150_000, mileage: 71_000, transmission: "Automatic", fuel: "Petrol", bodyType: "Sedan", city: "Taxila", status: "sold" },
  { id: "hyundai-kona-2019", make: "Hyundai", model: "Kona", variant: "FWD", year: 2019, price: 7_400_000, mileage: 44_000, transmission: "Automatic", fuel: "Petrol", bodyType: "Crossover", city: "Islamabad", status: "sold" },
  { id: "toyota-hilux-revo-2020", make: "Toyota", model: "Hilux", variant: "Revo G", year: 2020, price: 12_900_000, mileage: 63_000, transmission: "Manual", fuel: "Diesel", bodyType: "Pickup", city: "Attock", status: "sold" },
  { id: "bmw-x3-xdrive30i-2018", make: "BMW", model: "X3", variant: "xDrive30i", year: 2018, price: 18_900_000, mileage: 52_000, transmission: "Automatic", fuel: "Petrol", bodyType: "SUV", city: "Islamabad", status: "sold" },
];

const AVAILABILITY = {
  available: "https://schema.org/InStock",
  reserved: "https://schema.org/LimitedAvailability",
  sold: "https://schema.org/SoldOut",
};

const STATUS_LABEL = { available: "Available", reserved: "Reserved", sold: "Sold" };

const PHONE_E164 = "+923000000000";

const fullTitle = (v) =>
  `${v.year} ${[v.make, v.model, v.variant].filter(Boolean).join(" ")}`;
const pkr = (n) => `PKR ${new Intl.NumberFormat("en-US").format(n)}`;
const km = (n) => `${new Intl.NumberFormat("en-US").format(n)} km`;

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

async function overflow(page) {
  return page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
  }));
}

/** label -> value pairs out of the spec table's definition list. */
async function readSpecs(page) {
  return page.evaluate(() => {
    const rows = {};
    document.querySelectorAll("dl > div").forEach((row) => {
      const dt = row.querySelector("dt");
      const dd = row.querySelector("dd");
      if (dt && dd) rows[dt.textContent.trim()] = dd.textContent.trim();
    });
    return rows;
  });
}

/** All JSON-LD blocks on the page, parsed. */
async function readStructuredData(page) {
  return page.evaluate(() =>
    Array.from(document.querySelectorAll('script[type="application/ld+json"]')).map(
      (script) => {
        try {
          return JSON.parse(script.textContent ?? "null");
        } catch {
          return null;
        }
      },
    ),
  );
}

const findByType = (blocks, type) =>
  blocks.find((block) => block && block["@type"] === type);

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

  await page.setViewportSize({ width: 1440, height: 900 });

  /* ------------------------------------------------------------------ */
  console.log("\n== Every listing resolves with the right title and price ==");
  for (const vehicle of VEHICLES) {
    const response = await page.goto(`${BASE}/cars/${vehicle.id}`, {
      waitUntil: "networkidle",
    });
    const status = response?.status() ?? 0;
    const h1 = (await page.locator("h1").first().innerText()).trim();
    const body = await page.locator("main").innerText();

    check(
      status === 200 && h1 === fullTitle(vehicle) && body.includes(pkr(vehicle.price)),
      `${vehicle.id}`,
      `status ${status}, h1 "${h1}", price present: ${body.includes(pkr(vehicle.price))}`,
    );
  }

  /* ------------------------------------------------------------------ */
  console.log("\n== Unknown slug is a 404, not a rendered page ==");
  const missing = await page.goto(`${BASE}/cars/this-car-does-not-exist`, {
    waitUntil: "networkidle",
  });
  check(missing?.status() === 404, "unknown id returns 404", `got ${missing?.status()}`);
  check(
    /couldn.t find that page/i.test(await page.locator("h1").first().innerText()),
    "unknown id renders the not-found page",
  );

  /* ------------------------------------------------------------------ */
  console.log("\n== Available car: specs, panel and structured data ==");
  const available = VEHICLES.find((v) => v.id === "toyota-corolla-altis-grande-2021");
  await page.goto(`${BASE}/cars/${available.id}`, { waitUntil: "networkidle" });

  const specs = await readSpecs(page);
  const expectedSpecs = {
    Make: available.make,
    Model: available.model,
    Variant: available.variant,
    "Model year": String(available.year),
    Mileage: km(available.mileage),
    Transmission: available.transmission,
    Fuel: available.fuel,
    "Body type": available.bodyType,
    "Registered in": available.city,
  };
  for (const [label, value] of Object.entries(expectedSpecs)) {
    check(specs[label] === value, `spec "${label}" = ${value}`, `got "${specs[label]}"`);
  }

  check(
    (await page.locator("text=" + STATUS_LABEL[available.status]).count()) > 0,
    `status badge reads "${STATUS_LABEL[available.status]}"`,
  );

  /* The badge sits on top of the car photo, so it has to carry its own opaque
     enough background. The original tinted chip (12%) measured 1.52:1 against
     the bright sky in the Prado photo. This asserts the rendered alpha rather
     than the class name, so a restyle cannot quietly undo it.
     scripts/measure_badge_contrast.py does the pixel-level check. */
  const badgeAlpha = await page
    .locator("main span")
    .filter({ hasText: /^(Available|Reserved|Sold)$/ })
    .first()
    .evaluate((el) => {
      const bg = getComputedStyle(el).backgroundColor;
      const match = bg.match(/\/\s*([\d.]+)\s*\)/);
      if (match) return Number(match[1]);
      const rgb = bg.match(/rgba?\([^)]*?,\s*([\d.]+)\s*\)/);
      return rgb ? Number(rgb[1]) : 1;
    });
  check(
    badgeAlpha >= 0.85,
    "status badge scrim is opaque enough to survive a bright photo",
    `computed alpha ${badgeAlpha}`,
  );

  /* The sticky panel must fit a 1024x768 laptop, or `position: sticky` pins its
     top and the bottom of the panel becomes unreachable. */
  const panelBox = await page.locator("main aside").first().boundingBox();
  check(
    panelBox !== null && panelBox.height <= 768 - 96,
    "enquiry panel fits a 768px-tall viewport",
    `panel is ${Math.round(panelBox?.height ?? -1)}px tall, budget was ${768 - 96}px`,
  );

  /* Scoped to the enquiry panel. A bare `a[href*="wa.me"]` picks up the
     header's and footer's generic WhatsApp links, which would make this
     assertion pass or fail for reasons that have nothing to do with the
     panel — the first run of this harness did exactly that. */
  const panel = page.locator("main aside").first();

  const waHref = await panel.locator('a[href*="wa.me"]').first().getAttribute("href");
  const waText = decodeURIComponent(waHref ?? "");
  check(
    waText.includes(String(available.year)) &&
      waText.includes(available.make) &&
      waText.includes(available.model),
    "panel's WhatsApp link names this exact car",
    waText.slice(0, 120),
  );

  const telHref = await panel.locator('a[href^="tel:"]').first().getAttribute("href");
  check(telHref === `tel:${PHONE_E164}`, "call link uses the configured number", telHref);

  const crumbs = await page.locator('nav[aria-label="Breadcrumb"] li').allInnerTexts();
  check(crumbs.length === 3, "breadcrumb has three levels", crumbs.join(" / "));
  check(
    (await page
      .locator('nav[aria-label="Breadcrumb"] [aria-current="page"]')
      .count()) === 1,
    "breadcrumb marks the current page",
  );

  const canonical = await page.locator('link[rel="canonical"]').getAttribute("href");
  const canonicalUrl = new URL(canonical ?? "", BASE);
  check(
    canonicalUrl.pathname === `/cars/${available.id}` && canonicalUrl.search === "",
    "canonical points at this car",
    canonical ?? "(none)",
  );

  const blocks = await readStructuredData(page);
  const car = findByType(blocks, "Car");
  check(car !== undefined, "Car structured data present");
  check(
    car?.offers?.availability === AVAILABILITY[available.status],
    `structured availability is ${AVAILABILITY[available.status]}`,
    car?.offers?.availability,
  );
  check(car?.offers?.price === available.price, "structured price matches the page", String(car?.offers?.price));
  check(
    car?.mileageFromOdometer?.value === available.mileage,
    "structured mileage matches the page",
    String(car?.mileageFromOdometer?.value),
  );
  check(
    findByType(blocks, "BreadcrumbList") !== undefined,
    "BreadcrumbList structured data present",
  );

  check(
    (await page.locator("#similar article").count()) === 3,
    "three similar cars are shown",
    String(await page.locator("#similar article").count()),
  );
  const similarHrefs = await page
    .locator('#similar article a[href^="/cars/"]')
    .evaluateAll((els) => els.map((el) => el.getAttribute("href")));
  check(
    !similarHrefs.includes(`/cars/${available.id}`),
    "a car is never suggested as similar to itself",
    similarHrefs.join(", "),
  );
  const similarStatuses = similarHrefs.map(
    (href) => VEHICLES.find((v) => `/cars/${v.id}` === href)?.status,
  );
  check(
    similarStatuses.every((status) => status !== undefined && status !== "sold"),
    "no sold car is suggested",
    similarHrefs.join(", "),
  );

  check(
    /One photo on file/i.test(await page.locator("main").innerText()),
    "single-photo gallery says so and invites a request for more",
  );
  check(
    /Sample listing for layout only/i.test(await page.locator("main").innerText()),
    "placeholder-data notice is visible on the detail page",
  );
  check(
    (await page.locator("text=Ask us before you visit").count()) === 1,
    "buyer checklist is shown for a buyable car",
  );

  /* ------------------------------------------------------------------ */
  console.log("\n== Reserved car ==");
  const reserved = VEHICLES.find((v) => v.status === "reserved");
  await page.goto(`${BASE}/cars/${reserved.id}`, { waitUntil: "networkidle" });
  const reservedBlocks = await readStructuredData(page);
  check(
    findByType(reservedBlocks, "Car")?.offers?.availability === AVAILABILITY.reserved,
    "reserved car reports LimitedAvailability",
  );
  check(
    (await page.locator("text=Ask us before you visit").count()) === 1,
    "reserved car still offers the enquiry path",
  );

  /* ------------------------------------------------------------------ */
  console.log("\n== Sold car does not pretend to be for sale ==");
  const sold = VEHICLES.find((v) => v.status === "sold");
  await page.goto(`${BASE}/cars/${sold.id}`, { waitUntil: "networkidle" });
  const soldBody = await page.locator("main").innerText();

  check(/Sold for/i.test(soldBody), "sold page labels the figure \"Sold for\"");
  check(
    !/Asking price/i.test(soldBody),
    "sold page never says \"Asking price\"",
  );
  check(
    !/Ask us before you visit/i.test(soldBody),
    "sold page drops the pre-visit checklist",
  );
  check(
    /has been sold/i.test(soldBody),
    "sold page states plainly that the car is gone",
  );

  const soldWa = decodeURIComponent(
    (await page
      .locator("main aside")
      .first()
      .locator('a[href*="wa.me"]')
      .first()
      .getAttribute("href")) ?? "",
  );
  check(
    /sold/i.test(soldWa) && /similar/i.test(soldWa),
    "sold page's WhatsApp message asks for something similar",
    soldWa.slice(0, 130),
  );

  const soldBlocks = await readStructuredData(page);
  check(
    findByType(soldBlocks, "Car")?.offers?.availability === AVAILABILITY.sold,
    "sold car reports SoldOut",
  );

  /* ------------------------------------------------------------------ */
  console.log("\n== Responsive ==");
  for (const viewport of VIEWPORTS) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto(`${BASE}/cars/${available.id}`, { waitUntil: "networkidle" });
    const { scrollWidth, innerWidth } = await overflow(page);
    check(
      scrollWidth <= innerWidth + 1,
      `${viewport.name}: no horizontal overflow`,
      `${scrollWidth} > ${innerWidth}`,
    );
  }

  /* ------------------------------------------------------------------ */
  console.log("\n== Inventory links resolve ==");
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${BASE}/cars?status=all`, { waitUntil: "networkidle" });
  const cardHrefs = await page
    .locator('article a[href^="/cars/"]')
    .evaluateAll((els) => [...new Set(els.map((el) => el.getAttribute("href")))]);
  check(
    cardHrefs.length === VEHICLES.length,
    `every one of the ${VEHICLES.length} cars has a detail link`,
    `${cardHrefs.length} unique links`,
  );

  let broken = 0;
  for (const href of cardHrefs) {
    const response = await page.request.get(`${BASE}${href}`);
    if (response.status() !== 200) broken += 1;
  }
  check(broken === 0, "no card links to a missing detail page", `${broken} broken`);

  /* ------------------------------------------------------------------ */
  console.log("\n== Sitemap covers the detail pages ==");
  const sitemap = await (await page.request.get(`${BASE}/sitemap.xml`)).text();
  const missingFromSitemap = VEHICLES.filter(
    (vehicle) => !sitemap.includes(`/cars/${vehicle.id}`),
  ).map((vehicle) => vehicle.id);
  check(
    missingFromSitemap.length === 0,
    "every vehicle appears in the sitemap",
    missingFromSitemap.join(", "),
  );

  /* ------------------------------------------------------------------ */
  console.log("\n== Console ==");
  /* Two expected noise sources, both filtered by URL so the check keeps its
     teeth everywhere else:
       - the missing-favicon request Next logs on a cold start
       - the browser logging the 404 response for the deliberately-unknown
         slug this harness requests above. A 404 is the correct answer there,
         so the console line about it is not a defect.
     Uncaught page errors are NOT filtered: a hydration mismatch on the 404
     route was a real bug this harness caught, and filtering it would hide it
     again. */
  const realConsoleErrors = consoleErrors.filter(
    (line) => !/favicon/i.test(line) && !/this-car-does-not-exist/.test(line),
  );
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
