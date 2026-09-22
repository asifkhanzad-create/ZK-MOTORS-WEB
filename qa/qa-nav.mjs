/**
 * ZK Motors — floating pill navbar QA harness.
 *
 * The header is site-wide chrome, so it is not covered by either of the page
 * harnesses. Its failure modes are the ones that are invisible in a screenshot:
 *
 *   - the capsule losing its own backdrop over a light section, which is the
 *     exact reason the demo's `bg-white/6` was replaced with an ink scrim
 *   - the sticky results toolbar sticking at the wrong offset and sliding under
 *     the header
 *   - a disclosure menu that opens but cannot be closed from the keyboard, or
 *     that leaves its links in the tab order while closed
 *   - the dropped panel being squeezed to the capsule's width on a small phone
 *   - the current-page pill being mistaken for the cobalt "Find a Car" button
 *     sitting in the same capsule
 *   - where a nav link leaves the scroll position: a cross-route click must land
 *     at the top, and a click on the current page's own link must scroll there
 *     *smoothly* (Next skips its reset for the current route, so without help
 *     that click does nothing at all)
 *
 * Usage:
 *   node qa/qa-nav.mjs <baseUrl> [outDir]
 */

import { mkdir } from "node:fs/promises";
import path from "node:path";

import { chromium } from "playwright-core";

const BASE = (process.argv[2] ?? "http://localhost:3000").replace(/\/$/, "");
const OUT = path.resolve(process.argv[3] ?? "screenshots/nav");

const VIEWPORTS = [
  { name: "mobile-360", width: 360, height: 780 },
  { name: "mobile-375", width: 375, height: 812 },
  { name: "tablet-768", width: 768, height: 1024 },
  { name: "laptop-1024", width: 1024, height: 768 },
  { name: "desktop-1280", width: 1280, height: 800 },
  { name: "desktop-1440", width: 1440, height: 900 },
];

/** The site's lightest band. Every text-on-capsule check is measured over it. */
const BONE_50 = [250, 250, 249];

/** The header is a fixed 86px by design; see --spacing-nav in globals.css. */
const HEADER_HEIGHT = 86;

/* An inactive nav link. Chosen as "Contact" because it is never the current
   page on the two routes this harness visits — on / the first link in the list
   is "Home", which is the *active* pill and is deliberately dark-on-light. */
const INACTIVE_LINK = 'header nav[aria-label="Main"] a[href="/contact"]';

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

/* ---------------------------------------------------------------- colour -- */

function srgbToLinear(channel) {
  const v = channel / 255;
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
}

function luminance([r, g, b]) {
  return 0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b);
}

function contrast(a, b) {
  const la = luminance(a);
  const lb = luminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

/** Paint a translucent colour over an opaque one. */
function composite(fg, alpha, bg) {
  return fg.map((channel, i) => Math.round(channel * alpha + bg[i] * (1 - alpha)));
}

/**
 * Resolve an element's computed colour to sRGB bytes, whatever format the
 * browser serialises it in.
 *
 * This cannot be done by parsing the string. Tailwind v4 compiles `bg-ink-950/85`
 * to `color-mix(in oklab, …)`, and Chromium reports the computed value as
 * `oklab(0.221661 -0.00124659 -0.0125306 / 0.85)` — so a naive
 * `value.match(/[\d.]+/g)` reads three 0..1 channels as 0..255 and reports a
 * near-black capsule with a nonsense contrast ratio. It also silently ignores
 * the leading minus signs on the a/b axes.
 *
 * Painting the colour onto a canvas and reading the pixel back hands the whole
 * conversion to the engine. The magenta sentinel catches a value the canvas
 * refuses to parse: fillStyle keeps its previous value on an invalid
 * assignment, so without the sentinel a parse failure would look like black.
 */
async function resolveColor(locator, property = "backgroundColor") {
  return locator.evaluate((el, prop) => {
    const raw = getComputedStyle(el)[prop];

    const canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });

    ctx.clearRect(0, 0, 1, 1);
    ctx.fillStyle = "#ff00ff";
    ctx.fillStyle = raw;
    ctx.fillRect(0, 0, 1, 1);

    const data = ctx.getImageData(0, 0, 1, 1).data;
    const rgb = [data[0], data[1], data[2]];
    const parsed = !(rgb[0] === 255 && rgb[1] === 0 && rgb[2] === 255);

    return { raw, rgb, alpha: data[3] / 255, parsed };
  }, property);
}

/* --------------------------------------------------------------- capture -- */

/**
 * Read one pixel out of an element's own screenshot.
 *
 * Element screenshots are rendered pixels, so for a translucent element this
 * returns the *composited* result — the capsule colour as it actually appears
 * over whatever is behind it. Coordinates are relative to the element, which
 * avoids the page-vs-viewport ambiguity of `page.screenshot({ clip })`.
 *
 * The image is decoded in the browser rather than in Node so the harness keeps
 * its single dependency.
 */
async function sampleElementPixel(page, locator, offsetX, offsetY) {
  const png = await locator.screenshot();
  const dataUrl = `data:image/png;base64,${png.toString("base64")}`;

  return page.evaluate(
    async ({ url, x, y }) => {
      const image = new Image();
      image.src = url;
      await image.decode();

      const canvas = document.createElement("canvas");
      canvas.width = image.width;
      canvas.height = image.height;

      const ctx = canvas.getContext("2d");
      ctx.drawImage(image, 0, 0);
      const data = ctx.getImageData(x, y, 1, 1).data;

      return [data[0], data[1], data[2]];
    },
    { url: dataUrl, x: Math.round(offsetX), y: Math.round(offsetY) },
  );
}

/* ------------------------------------------------------------------- run -- */

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

  const capsule = page.locator('header nav[aria-label="Main"]');
  const toggle = page.locator("header button[aria-controls]");

  /*
   * Note: this harness deliberately does NOT force `scroll-behavior: auto` on
   * <html> the way an earlier version did. That override hides the exact
   * regression the "Nav links and scroll position" section exists to catch —
   * forcing `auto` makes Next's scroll reset instant, so the old 131px landing
   * would pass. The site no longer sets smooth scrolling globally (see the note
   * in globals.css), so there is nothing to suppress: programmatic scrolling is
   * already instant, and the navbar's scroll-to-top asks for `smooth`
   * explicitly.
   */

  /* ------------------------------------------------------------------ */
  console.log("\n== The capsule carries its own backdrop ==");
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${BASE}/`, { waitUntil: "networkidle" });

  const scrim = await resolveColor(capsule);
  const wordmark = await resolveColor(capsule.locator("> a").first(), "color");
  const navLink = await resolveColor(page.locator(INACTIVE_LINK), "color");

  check(scrim.parsed, "capsule fill parsed as a colour", scrim.raw);
  check(
    scrim.alpha >= 0.85,
    "capsule fill is at least 85% opaque",
    `${scrim.raw} -> alpha ${scrim.alpha.toFixed(3)}`,
  );
  check(
    scrim.rgb[0] < 60 && scrim.rgb[1] < 60 && scrim.rgb[2] < 70,
    "capsule fill is the charcoal scrim, not a white tint",
    `rgb(${scrim.rgb.join(", ")})`,
  );

  /* The comparison that justifies the departure from the demo: `bg-white/6`
     with near-white text over a bone-50 band measures 1.00:1 — the capsule and
     its labels both disappear. */
  const overLight = composite(scrim.rgb, scrim.alpha, BONE_50);

  const wordmarkRatio = contrast(wordmark.rgb, overLight);
  check(
    wordmarkRatio >= 7,
    `wordmark clears 7:1 over the lightest band (${wordmarkRatio.toFixed(2)}:1)`,
    `${wordmark.raw} on rgb(${overLight.join(", ")})`,
  );

  const navLinkRatio = contrast(navLink.rgb, overLight);
  check(
    navLinkRatio >= 4.5,
    `nav links clear 4.5:1 over the lightest band (${navLinkRatio.toFixed(2)}:1)`,
    `${navLink.raw} on rgb(${overLight.join(", ")})`,
  );

  /* Now measure it rather than computing it: park a bone-50 section behind the
     sticky header and read the capsule's own rendered pixels. */
  const lightSection = page.locator("section.bg-bone-50").first();
  if ((await lightSection.count()) > 0) {
    await lightSection.evaluate((el) => el.scrollIntoView({ block: "start" }));
    await page.waitForTimeout(250);

    const box = await capsule.boundingBox();
    /* 3px inside the top edge: past the 1px border and the 1px inset highlight,
       and still inside the 6px padding band, so no glyph is sampled. */
    const pixel = await sampleElementPixel(page, capsule, box.width / 2, 3);

    check(
      luminance(pixel) < 0.06,
      "measured capsule pixel over a light section is dark",
      `rgb(${pixel.join(", ")})`,
    );

    const measuredRatio = contrast(navLink.rgb, pixel);
    check(
      measuredRatio >= 4.5,
      `measured nav-link contrast over the light section is ${measuredRatio.toFixed(2)}:1`,
      `rgb(${pixel.join(", ")})`,
    );

    await page.screenshot({ path: path.join(OUT, "capsule-over-light-section.png") });
  } else {
    check(false, "found a light section to measure the capsule over");
  }

  /* ------------------------------------------------------------------ */
  console.log("\n== The current-page pill ==");
  await page.goto(`${BASE}/cars`, { waitUntil: "networkidle" });

  const current = page.locator('header nav[aria-label="Main"] a[aria-current="page"]');
  const currentCount = await current.count();
  check(currentCount === 1, "exactly one nav link is marked current", `${currentCount} found`);

  if (currentCount === 1) {
    const label = (await current.innerText()).trim();
    check(label === "Cars", "the current link on /cars is Cars", label);

    const activeBg = await resolveColor(current);
    const activeFg = await resolveColor(current, "color");
    const activeRatio = contrast(activeFg.rgb, activeBg.rgb);

    check(
      activeBg.rgb[0] > 240 && activeBg.alpha === 1,
      "current pill is a solid near-white fill",
      activeBg.raw,
    );
    check(
      activeRatio >= 7,
      `current pill text clears 7:1 (${activeRatio.toFixed(2)}:1)`,
      `${activeFg.raw} on ${activeBg.raw}`,
    );
    /* The cobalt rule governs the buying path. The current-page marker is
       deliberately neutral so it cannot be read as a second call to action
       beside the "Find a Car" button in the same capsule. */
    check(
      !(activeBg.rgb[2] > activeBg.rgb[0] + 20),
      "current pill is not the accent cobalt",
      `rgb(${activeBg.rgb.join(", ")})`,
    );
  }

  /* ------------------------------------------------------------------ */
  console.log("\n== Sell Your Car stays neutral ==");
  const sell = await resolveColor(
    page.locator('header nav[aria-label="Main"] a[href="/sell-your-car"]'),
    "color",
  );
  const neighbour = await resolveColor(page.locator(INACTIVE_LINK), "color");

  check(
    sell.rgb.join() === neighbour.rgb.join(),
    "Sell Your Car uses the same neutral colour as its neighbours",
    `${sell.raw} vs ${neighbour.raw}`,
  );

  /* ------------------------------------------------------------------ */
  console.log("\n== The icon-only WhatsApp button ==");
  /* Regression guard for a real bug: this button was `size: "md"` plus a
     `className` of `px-0`. `cn()` is a plain join, not tailwind-merge, so the
     `px-0` sat beside the size's own `px-5` and lost to it — `px-5` is emitted
     later in the compiled sheet. The 44px pill therefore carried 40px of
     padding and squeezed its 24px glyph down to **4px** wide, which is what
     "the green icon looks too small" actually was. A bounding box catches
     that; a screenshot at a glance does not. */
  const waButton = page.locator('header nav[aria-label="Main"] a[aria-label*="WhatsApp"]');
  const waBox = await waButton.boundingBox();
  const waIcon = await waButton.locator("svg").boundingBox();

  check(
    waBox !== null && Math.abs(waBox.width - waBox.height) <= 1,
    "the WhatsApp button is square",
    waBox ? `${Math.round(waBox.width)}x${Math.round(waBox.height)}` : "no box",
  );
  check(
    waIcon !== null && Math.abs(waIcon.width - waIcon.height) <= 1,
    "the glyph is not squashed by leftover padding",
    waIcon ? `${Math.round(waIcon.width)}x${Math.round(waIcon.height)}` : "no box",
  );
  check(
    waIcon !== null && waIcon.width >= 20,
    "the glyph renders at least 20px wide",
    waIcon ? `${Math.round(waIcon.width)}px` : "no box",
  );
  check(
    waBox !== null && waBox.width >= 44 && waBox.height >= 44,
    "the button still meets the 44px touch target",
    waBox ? `${Math.round(waBox.width)}x${Math.round(waBox.height)}` : "no box",
  );

  /* ------------------------------------------------------------------ */
  console.log("\n== The disclosure menu ==");
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto(`${BASE}/`, { waitUntil: "networkidle" });

  const panelId = await toggle.getAttribute("aria-controls");
  check(Boolean(panelId), "toggle points at the panel with aria-controls", String(panelId));
  const panel = page.locator(`[id="${panelId}"]`);

  check(
    (await toggle.getAttribute("aria-expanded")) === "false",
    "toggle reports aria-expanded=false while closed",
  );

  /* Closed must mean hidden, not merely transparent — otherwise the links are
     still reachable with Tab and still announced by a screen reader. */
  check(
    (await panel.evaluate((el) => getComputedStyle(el).visibility)) === "hidden",
    "closed panel is visibility:hidden",
  );

  const heightClosed = await page.evaluate(() => document.documentElement.scrollHeight);

  await toggle.click();
  await page.waitForTimeout(300);

  check(
    (await toggle.getAttribute("aria-expanded")) === "true",
    "toggle reports aria-expanded=true once open",
  );
  check(await panel.isVisible(), "panel is visible once open");

  const capsuleBox = await capsule.boundingBox();
  const panelBox = await panel.boundingBox();

  check(
    panelBox !== null && panelBox.width >= 375 - 40,
    "panel spans the header width, not the capsule width",
    panelBox
      ? `panel ${Math.round(panelBox.width)}px vs capsule ${Math.round(capsuleBox.width)}px`
      : "no box",
  );
  check(
    panelBox !== null &&
      capsuleBox !== null &&
      panelBox.y >= capsuleBox.y + capsuleBox.height - 1,
    "panel drops below the capsule rather than overlapping it",
  );

  const rowHeights = await panel
    .locator("a")
    .evaluateAll((els) => els.map((el) => Math.round(el.getBoundingClientRect().height)));
  check(
    rowHeights.length > 0 && rowHeights.every((h) => h >= 44),
    "every panel row is at least a 44px touch target",
    rowHeights.join(", "),
  );

  await page.screenshot({ path: path.join(OUT, "mobile-375-menu-open.png") });

  const heightOpen = await page.evaluate(() => document.documentElement.scrollHeight);
  check(
    heightOpen === heightClosed,
    "opening the panel does not push the page down",
    `${heightClosed} -> ${heightOpen}`,
  );

  /* Escape closes and hands focus back to the toggle. */
  await page.keyboard.press("Escape");
  await page.waitForTimeout(300);

  check((await toggle.getAttribute("aria-expanded")) === "false", "Escape closes the panel");
  check(
    await toggle.evaluate((el) => el === document.activeElement),
    "Escape returns focus to the toggle",
  );

  /* A press outside closes it, and does not steal focus. */
  await toggle.click();
  await page.waitForTimeout(300);
  await page.mouse.click(187, 500);
  await page.waitForTimeout(300);

  check(
    (await toggle.getAttribute("aria-expanded")) === "false",
    "a press outside closes the panel",
  );
  check(
    !(await toggle.evaluate((el) => el === document.activeElement)),
    "closing from an outside press does not steal focus back",
  );

  /* Following a link closes it — including a link to the page you are already
     on, where the pathname never changes, so only the link's own handler can
     close it. */
  await toggle.click();
  await page.waitForTimeout(300);
  await panel.locator('a[href="/"]').first().click();
  await page.waitForTimeout(400);
  check(
    (await toggle.getAttribute("aria-expanded")) === "false",
    "following a same-page link closes the panel",
  );

  /* And a real navigation closes it too. `menuOpen` is derived from the
     pathname the panel was opened at, so this has to hold without any
     setState-in-effect. */
  await toggle.click();
  await page.waitForTimeout(300);
  await panel.locator('a[href="/cars"]').first().click();
  await page.waitForURL(/\/cars/);
  await page.waitForTimeout(400);
  check(
    (await toggle.getAttribute("aria-expanded")) === "false",
    "navigating to another page closes the panel",
    page.url(),
  );

  /* ------------------------------------------------------------------ */
  console.log("\n== Nav links and scroll position ==");
  await page.setViewportSize({ width: 1280, height: 800 });

  const carsLink = () =>
    page.locator('header nav[aria-label="Main"]').getByRole("link", { name: "Cars", exact: true });

  /* Navigating to a different route has to land at the top. This regressed
     once: with `scroll-behavior: smooth` on <html>, Next's scroll reset animated
     from the old position, the incoming page swapped in mid-animation and the
     animation settled short — /cars opened at 131px instead of 0. */
  await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await page.evaluate(() => window.scrollTo(0, 2400));
  await page.waitForTimeout(300);

  await carsLink().click();
  await page.waitForURL(/\/cars$/);
  await page.waitForTimeout(900);

  const landed = await page.evaluate(() => Math.round(window.scrollY));
  check(landed <= 2, "a link to another route lands at the top", `scrollY ${landed}`);

  /* And clicking a link to the page you are already on has to scroll to the
     top. Next.js skips its reset for the current route, so without handling it
     ourselves the click did nothing at all — scrollY stayed at 1800. */
  await page.evaluate(() => window.scrollTo(0, 1800));
  await page.waitForTimeout(300);
  await carsLink().click();
  await page.waitForTimeout(900);

  const afterSamePage = await page.evaluate(() => Math.round(window.scrollY));
  check(
    afterSamePage <= 2,
    "the current page's own link scrolls to the top",
    `scrollY ${afterSamePage}`,
  );

  /* It must be *animated*, which is the whole point of the request. Sample
     mid-flight: a smooth scroll is still travelling after 120ms, an instant one
     has already arrived. */
  await page.evaluate(() => window.scrollTo(0, 1800));
  await page.waitForTimeout(300);
  await carsLink().click();
  await page.waitForTimeout(120);
  const midFlight = await page.evaluate(() => Math.round(window.scrollY));
  await page.waitForTimeout(900);

  check(
    midFlight > 2 && midFlight < 1790,
    "the scroll to the top is animated, not a jump",
    `after 120ms scrollY was ${midFlight}`,
  );

  /* ------------------------------------------------------------------ */
  console.log("\n== The toolbar clears the header ==");
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${BASE}/cars`, { waitUntil: "networkidle" });
  await page.evaluate(() => window.scrollTo(0, 1400));
  await page.waitForTimeout(400);

  const headerBox = await page.locator("header").boundingBox();
  const toolbarTop = await page
    .locator('[aria-live="polite"]')
    .first()
    .evaluate((el) => (el.closest("div.sticky") ?? el).getBoundingClientRect().top);

  check(
    toolbarTop >= headerBox.y + headerBox.height - 1,
    "sticky toolbar sits below the header, not under it",
    `toolbar top ${Math.round(toolbarTop)}px vs header bottom ${Math.round(headerBox.y + headerBox.height)}px`,
  );

  /* ------------------------------------------------------------------ */
  console.log("\n== Responsive ==");
  for (const viewport of VIEWPORTS) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto(`${BASE}/cars`, { waitUntil: "networkidle" });

    const metrics = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
    }));
    check(
      metrics.scrollWidth <= metrics.innerWidth + 1,
      `${viewport.name}: no horizontal overflow`,
      `scrollWidth ${metrics.scrollWidth} vs innerWidth ${metrics.innerWidth}`,
    );

    const box = await capsule.boundingBox();
    check(
      box !== null && box.width <= viewport.width,
      `${viewport.name}: capsule fits the viewport`,
      box ? `capsule ${Math.round(box.width)}px` : "no box",
    );

    /* Regression guard for a real bug this harness caught: the "Find a Car" CTA
       is `hidden md:inline-flex`, and it must be on a wrapper rather than passed
       into buttonClasses. `cn()` in src/lib/utils.ts is a plain join, not
       tailwind-merge, so a `hidden` handed to buttonClasses sits beside the
       variant's own `inline-flex` — and the compiled sheet emits `.inline-flex`
       after `.hidden`, so `inline-flex` wins and the button never hides. The
       capsule then overflowed a 360px viewport. */
    const ctaVisible = await page
      .locator("header")
      .getByRole("link", { name: "Find a Car" })
      .isVisible();
    const ctaShouldShow = viewport.width >= 768;
    check(
      ctaVisible === ctaShouldShow,
      `${viewport.name}: "Find a Car" is ${ctaShouldShow ? "shown" : "hidden"}`,
      `isVisible=${ctaVisible}`,
    );

    /* The capsule is a child of the sticky header; the header itself has to be
       the documented height or every sticky offset in the app is wrong. */
    const headerHeight = await page
      .locator("header")
      .evaluate((el) => el.getBoundingClientRect().height);
    check(
      Math.abs(headerHeight - HEADER_HEIGHT) <= 1,
      `${viewport.name}: header is ${HEADER_HEIGHT}px tall (matches --spacing-nav)`,
      `${headerHeight}px`,
    );

    await page.screenshot({ path: path.join(OUT, `${viewport.name}-header.png`) });
  }

  /* ------------------------------------------------------------------ */
  console.log("\n== Console ==");
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
