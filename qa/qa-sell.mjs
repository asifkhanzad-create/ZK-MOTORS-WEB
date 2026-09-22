/**
 * Phase 4 harness — the sell-your-car flow.
 *
 * What this is guarding against:
 *   - the page existing but every "Sell Your Car" CTA on the site still 404ing
 *   - a form that validates nothing, or validates silently and jumps the
 *     visitor to a field with no explanation
 *   - the form looking like it submitted when nothing was sent — there is no
 *     backend until Phase 5, so the only honest behaviour is to hand the
 *     visitor to WhatsApp and say so
 *   - FAQ structured data that does not match the questions on the page, which
 *     is what search engines penalise
 *   - a horizontal scrollbar at any viewport
 *
 * Usage:
 *   node qa/qa-sell.mjs <baseUrl>
 */
import { chromium } from "playwright-core";

const BASE = (process.argv[2] ?? "http://localhost:3000").replace(/\/$/, "");

let failures = 0;
function check(ok, label, detail = "") {
  if (!ok) failures++;
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}${detail ? `  (${detail})` : ""}`);
}

const browser = await chromium.launch({ channel: "msedge", headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

const consoleErrors = [];
page.on("console", (m) => m.type() === "error" && consoleErrors.push(m.text()));
page.on("pageerror", (e) => consoleErrors.push(`pageerror: ${e.message}`));

/* Swallow the popup and record where it was pointed instead, so the composed
   WhatsApp URL can be inspected rather than a real tab opening. */
await page.addInitScript(() => {
  window.__opened = [];
  window.open = (url) => {
    window.__opened.push(String(url));
    return null;
  };
});

/* ------------------------------------------------------------------ */
console.log("\n== The route ==");
{
  const response = await page.goto(`${BASE}/sell-your-car`, { waitUntil: "networkidle" });
  check(response?.status() === 200, "GET /sell-your-car returns 200", `status ${response?.status()}`);

  const h1s = await page.getByRole("heading", { level: 1 }).allTextContents();
  check(h1s.length === 1, "the page has exactly one <h1>", `${h1s.length} found: ${h1s.join(" | ")}`);

  const sitemap = await page.request.get(`${BASE}/sitemap.xml`);
  const xml = await sitemap.text();
  check(xml.includes("/sell-your-car"), "the sitemap lists /sell-your-car");
}

/* ------------------------------------------------------------------ */
console.log("\n== Every internal link resolves ==");
{
  /* This used to carry a `knownUnbuilt` allowance for /about, /contact,
     /privacy and /terms — four routes the navbar and footer linked from every
     page while nothing served them. The allowance is gone on purpose: a
     footer that 404s is a trust problem on a site whose entire job is to look
     credible, and a whitelist is exactly what would let it come back unnoticed.
     Zero is the only acceptable number here. */
  const seeds = [
    "/",
    "/cars",
    "/sell-your-car",
    "/about",
    "/contact",
    "/privacy",
    "/terms",
  ];
  const hrefs = new Set();

  for (const path of seeds) {
    const response = await page.goto(`${BASE}${path}`, { waitUntil: "networkidle" });
    check(response?.status() === 200, `GET ${path} returns 200`, `status ${response?.status()}`);
    for (const href of await page.locator("a[href^='/']").evaluateAll((els) =>
      els.map((el) => el.getAttribute("href")),
    )) {
      if (href) hrefs.add(href.split("#")[0].split("?")[0]);
    }
  }

  /* Detail pages are linked from the cards on /cars, so a single sample is
     enough to prove the dynamic route resolves — but it must be a real one. */
  const sampleDetail = [...hrefs].find((href) => /^\/cars\/[^/]+$/.test(href));
  check(sampleDetail !== undefined, "a vehicle detail page is linked from the inventory grid", sampleDetail ?? "none found");
  if (sampleDetail) {
    const response = await page.request.get(`${BASE}${sampleDetail}`);
    check(response.status() === 200, `GET ${sampleDetail} returns 200`, `status ${response.status()}`);
  }

  const dead = [];
  for (const href of hrefs) {
    if (!href || href === "/") continue;
    const res = await page.request.get(`${BASE}${href}`);
    if (res.status() === 404) dead.push(href);
  }

  check(
    dead.length === 0,
    "no internal link anywhere on the site 404s",
    dead.length ? `dead: ${dead.join(", ")}` : `checked ${hrefs.size} distinct links`,
  );
}

/* ------------------------------------------------------------------ */
const FIELDS = [
  "make",
  "model",
  "year",
  "mileage",
  "transmission",
  "fuel",
  "city",
  "condition",
  "expectedPrice",
  "name",
  "phone",
  "notes",
];

async function goToForm() {
  await page.goto(`${BASE}/sell-your-car`, { waitUntil: "networkidle" });
}

console.log("\n== The form ==");
await goToForm();
{
  for (const field of FIELDS) {
    check(
      (await page.locator(`[name="${field}"]`).count()) === 1,
      `the form has a "${field}" control`,
    );
  }

  /* Every control must have an accessible name, or the label is not wired up. */
  const unlabelled = [];
  for (const field of FIELDS) {
    const name = await page
      .locator(`[name="${field}"]`)
      .evaluate((el) => {
        const label = el.id ? document.querySelector(`label[for="${el.id}"]`) : null;
        return label?.textContent?.trim() ?? el.getAttribute("aria-label") ?? "";
      });
    if (!name) unlabelled.push(field);
  }
  check(unlabelled.length === 0, "every control has an accessible name", unlabelled.join(", "));
}

/* ------------------------------------------------------------------ */
console.log("\n== Validation ==");
await goToForm();
{
  await page.getByRole("button", { name: /send details on whatsapp/i }).click();
  await page.waitForTimeout(150);

  const errorCount = await page.locator("[aria-invalid='true']").count();
  check(errorCount >= 10, "an empty submit flags every required field", `${errorCount} flagged`);

  const focused = await page.evaluate(() => document.activeElement?.getAttribute("name"));
  check(focused === "make", "focus moves to the first invalid field", `focused: ${focused}`);

  const openedAfterInvalid = await page.evaluate(() => window.__opened.length);
  check(openedAfterInvalid === 0, "an invalid submit does not open WhatsApp", `${openedAfterInvalid} opened`);

  /* A too-short phone must be rejected — the most likely real mistake. */
  await page.locator('[name="phone"]').fill("12345");
  await page.locator('[name="phone"]').blur();
  await page.getByRole("button", { name: /send details on whatsapp/i }).click();
  await page.waitForTimeout(150);
  check(
    (await page.locator('[name="phone"]').getAttribute("aria-invalid")) === "true",
    "a five-digit phone number is rejected",
  );

  /* An implausible model year must be rejected too. */
  await page.locator('[name="year"]').fill("1812");
  await page.getByRole("button", { name: /send details on whatsapp/i }).click();
  await page.waitForTimeout(150);
  check(
    (await page.locator('[name="year"]').getAttribute("aria-invalid")) === "true",
    "a year of 1812 is rejected",
  );

  /* Correcting a field clears its error rather than leaving it stale. */
  await page.locator('[name="make"]').fill("Toyota");
  await page.waitForTimeout(100);
  check(
    (await page.locator('[name="make"]').getAttribute("aria-invalid")) === null,
    "correcting a field clears its error",
  );
}

/* ------------------------------------------------------------------ */
console.log("\n== The submission ==");
await goToForm();
{
  const honesty = await page.getByText(/nothing is sent until you press send/i).count();
  check(honesty > 0, "the page says plainly that nothing is sent from here");

  await page.locator('[name="make"]').fill("Toyota");
  await page.locator('[name="model"]').fill("Corolla Altis Grande");
  await page.locator('[name="year"]').fill("2019");
  await page.locator('[name="mileage"]').fill("78000");
  await page.locator('[name="transmission"]').selectOption("Automatic");
  await page.locator('[name="fuel"]').selectOption("Petrol");
  await page.locator('[name="city"]').selectOption("Wah Cantt");
  await page.locator('[name="condition"]').selectOption("Good");
  await page.locator('[name="expectedPrice"]').fill("5400000");
  await page.locator('[name="name"]').fill("Ahmed");
  await page.locator('[name="phone"]').fill("0300 1234567");
  await page.locator('[name="notes"]').fill("Second owner, service history available.");

  await page.getByRole("button", { name: /send details on whatsapp/i }).click();
  await page.waitForTimeout(250);

  const opened = await page.evaluate(() => window.__opened);
  check(opened.length === 1, "a valid submit opens exactly one WhatsApp link", `${opened.length} opened`);

  const url = opened[0] ?? "";
  check(url.startsWith("https://wa.me/"), "the link is a wa.me deep link", url.slice(0, 40));

  const text = decodeURIComponent(new URL(url).searchParams.get("text") ?? "");
  const expectations = [
    ["the model year, make and model", "2019 Toyota Corolla Altis Grande"],
    ["the mileage, formatted", "78,000 km"],
    ["the transmission", "Transmission: Automatic"],
    ["the city", "City: Wah Cantt"],
    ["the condition", "Condition: Good"],
    ["the expected price, formatted", "PKR 5,400,000"],
    ["the sender's name", "Name: Ahmed"],
    ["the sender's phone", "Phone: 0300 1234567"],
    ["the free-text notes", "Second owner"],
  ];
  for (const [label, needle] of expectations) {
    check(text.includes(needle), `the message carries ${label}`, needle);
  }

  /* The confirmation must not claim anything was transmitted. */
  const panel = page.getByRole("status");
  check((await panel.count()) > 0, "a confirmation panel appears after submitting");
  const panelText = (await panel.first().textContent()) ?? "";
  check(
    /press send inside whatsapp/i.test(panelText),
    "the confirmation says the visitor still has to press send",
  );
  check(
    /did not/i.test(panelText),
    "the confirmation handles the pop-up being blocked",
  );
  check(
    !/\b(sent|submitted|received) (successfully|to us)\b/i.test(panelText),
    "the confirmation never claims the details were sent",
  );

  const preview = await page.locator("details pre").textContent();
  check(
    (preview ?? "").includes("Toyota Corolla Altis Grande"),
    "the confirmation shows the composed message",
  );
}

/* ------------------------------------------------------------------ */
console.log("\n== The FAQ ==");
await goToForm();
{
  const rendered = await page
    .locator("details summary")
    .evaluateAll((els) => els.map((el) => el.textContent?.replace(/\s*\+\s*$/, "").trim() ?? ""));
  const schemaRaw = await page
    .locator('script[type="application/ld+json"]')
    .first()
    .textContent();
  const schema = JSON.parse(schemaRaw ?? "{}");
  const asked = (schema.mainEntity ?? []).map((entry) => entry.name);

  check(rendered.length > 0, "the FAQ renders at least one question", `${rendered.length} questions`);
  check(
    JSON.stringify(rendered) === JSON.stringify(asked),
    "the FAQPage structured data matches the questions on the page",
    `${rendered.length} rendered vs ${asked.length} in schema`,
  );

  /* Native details/summary must open from the keyboard. */
  const first = page.locator("details").first();
  check(!(await first.evaluate((el) => el.open)), "a FAQ entry starts closed");
  await page.locator("details summary").first().focus();
  await page.keyboard.press("Enter");
  await page.waitForTimeout(100);
  check(await first.evaluate((el) => el.open), "Enter on a summary opens the entry");
}

/* ------------------------------------------------------------------ */
/* /about, /contact, /privacy and /terms were built after Phase 4 to clear
   four 404s. They are only reached by the link scan above, which checks that
   they *resolve* — not that they are usable. These are the checks that a page
   which merely returns 200 would fail. */
console.log("\n== The supporting pages ==");
const SUPPORTING = [
  { path: "/about", jsonLd: "AboutPage", notice: /sample content/i },
  { path: "/contact", jsonLd: "ContactPage" },
  { path: "/privacy", notice: /not legal advice/i },
  { path: "/terms", notice: /not legal advice/i },
];

for (const { path, jsonLd, notice } of SUPPORTING) {
  await page.goto(`${BASE}${path}`, { waitUntil: "networkidle" });

  const h1s = await page.getByRole("heading", { level: 1 }).allTextContents();
  check(h1s.length === 1, `${path}: exactly one <h1>`, `${h1s.length} found: ${h1s.join(" | ")}`);

  /* A skipped level (h1 straight to h3) is invisible in a screenshot and is a
     real navigation problem for a screen reader. */
  const levels = await page
    .locator("h1, h2, h3, h4, h5, h6")
    .evaluateAll((els) => els.map((el) => Number(el.tagName[1])));
  let skip = null;
  for (let i = 1; i < levels.length; i++) {
    if (levels[i] - levels[i - 1] > 1) {
      skip = `h${levels[i - 1]} straight to h${levels[i]}`;
      break;
    }
  }
  check(skip === null, `${path}: no skipped heading levels`, skip ?? `${levels.length} headings in order`);

  const alts = await page.locator("img").evaluateAll((els) => els.map((el) => el.getAttribute("alt")));
  check(
    !alts.some((alt) => alt === null),
    `${path}: every image carries an alt attribute`,
    `${alts.length} image(s)`,
  );

  const description = await page.locator('meta[name="description"]').getAttribute("content");
  check(
    Boolean(description && description.trim().length > 20),
    `${path}: has a real meta description`,
    description ? `${description.length} chars` : "missing",
  );

  const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
  let parseError = null;
  const parsed = [];
  for (const block of blocks) {
    try {
      parsed.push(JSON.parse(block));
    } catch (error) {
      parseError = error.message;
    }
  }
  check(parseError === null, `${path}: every JSON-LD block parses`, parseError ?? `${blocks.length} block(s)`);
  if (jsonLd) {
    const types = parsed
      .flatMap((node) => (Array.isArray(node) ? node : [node]))
      .flatMap((node) => node["@graph"] ?? [node])
      .map((node) => node["@type"]);
    check(types.includes(jsonLd), `${path}: carries ${jsonLd} structured data`, types.join(", "));
  }

  if (notice) {
    /* The notices are the mechanism that keeps unverified content from reading
       as fact. A redesign that drops one turns a placeholder into a claim. */
    const text = await page.locator("main").innerText();
    check(notice.test(text), `${path}: still carries its "${notice.source}" notice`);
  }
}

/* ------------------------------------------------------------------ */
console.log("\n== Layout ==");
const viewports = [
  { name: "mobile-360", width: 360, height: 800 },
  { name: "mobile-375", width: 375, height: 812 },
  { name: "tablet-768", width: 768, height: 1024 },
  { name: "laptop-1024", width: 1024, height: 800 },
  { name: "desktop-1280", width: 1280, height: 900 },
  { name: "desktop-1440", width: 1440, height: 900 },
];
/* Every page this harness is responsible for, not just the form. The four
   supporting pages previously got one width between them. */
const layoutPages = ["/sell-your-car", "/about", "/contact", "/privacy", "/terms"];
for (const viewport of viewports) {
  await page.setViewportSize({ width: viewport.width, height: viewport.height });
  for (const path of layoutPages) {
    await page.goto(`${BASE}${path}`, { waitUntil: "load" });
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    check(overflow <= 0, `${path} @ ${viewport.name}: no horizontal overflow`, `overflow ${overflow}px`);
  }
}

/* ------------------------------------------------------------------ */
console.log("\n== Console ==");
check(consoleErrors.length === 0, "no console errors or page errors", consoleErrors.slice(0, 3).join(" | "));

await browser.close();
console.log(`\n${failures === 0 ? "All checks passed." : `${failures} check(s) FAILED.`}\n`);
process.exit(failures === 0 ? 0 : 1);
