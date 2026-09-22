/**
 * Independent verification of the smooth-scroll fix, written after the change
 * so it measures the shipped behaviour rather than a forced variant.
 *
 * It reproduces the user's exact flow and samples scrollY every 60ms, so a jump
 * and an animation are distinguishable rather than inferred.
 *
 *   node qa/probe-scroll-verify.mjs http://localhost:3000
 */
import { chromium } from "playwright-core";

const base = process.argv[2] ?? "http://localhost:3000";
const browser = await chromium.launch({ channel: "msedge", headless: true });
const page = await browser.newPage();
await page.setViewportSize({ width: 1280, height: 800 });

const nav = () => page.locator('header nav[aria-label="Main"]');
const link = (name) => nav().getByRole("link", { name, exact: true });

/** Sample scrollY every 60ms for 900ms and describe the curve. */
async function trace(label) {
  const samples = [];
  for (let t = 0; t < 900; t += 60) {
    samples.push(await page.evaluate(() => Math.round(window.scrollY)));
    await page.waitForTimeout(60);
  }
  const start = samples[0];
  const end = samples[samples.length - 1];
  const peak = Math.max(...samples);
  const distinct = new Set(samples).size;
  const kind = distinct <= 2 ? "JUMP (or no movement)" : "ANIMATED";
  console.log(`\n  ${label}`);
  console.log(`    scroll-behavior = ${await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior)}`);
  console.log(`    ${samples.join(" -> ")}`);
  console.log(`    start ${start}, peak ${peak}, landed ${end}, ${distinct} distinct values -> ${kind}`);
  console.log(`    url ${page.url()}`);
  return { start, end, peak, distinct };
}

console.log(`\n=== ${base} ===`);

/* 1. The reported case: on the homepage, scrolled well down, click "Cars". */
await page.goto(`${base}/`, { waitUntil: "networkidle" });
await page.evaluate(() => window.scrollTo(0, 2400));
await page.waitForTimeout(400);
await link("Cars").click();
await trace("1. homepage @2400 -> click Cars  (cross-route)");

/* 2. Already on /cars, scrolled down, click "Cars" — the dead case. */
await page.goto(`${base}/cars`, { waitUntil: "networkidle" });
await page.evaluate(() => window.scrollTo(0, 1800));
await page.waitForTimeout(400);
await link("Cars").click();
await trace("2. /cars @1800 -> click Cars  (same route)");

/* 3. Already on /cars, click "Home" — cross-route the other way. */
await page.goto(`${base}/cars`, { waitUntil: "networkidle" });
await page.evaluate(() => window.scrollTo(0, 1800));
await page.waitForTimeout(400);
await link("Home").click();
await trace("3. /cars @1800 -> click Home  (cross-route)");

/* 4. prefers-reduced-motion must skip the animation. */
const reduced = await browser.newContext({ reducedMotion: "reduce", viewport: { width: 1280, height: 800 } });
const rp = await reduced.newPage();
await rp.goto(`${base}/cars`, { waitUntil: "networkidle" });
await rp.evaluate(() => window.scrollTo(0, 1800));
await rp.waitForTimeout(400);
await rp.locator('header nav[aria-label="Main"]').getByRole("link", { name: "Cars", exact: true }).click();
await rp.waitForTimeout(120);
const reducedMid = await rp.evaluate(() => Math.round(window.scrollY));
await rp.waitForTimeout(700);
const reducedEnd = await rp.evaluate(() => Math.round(window.scrollY));
console.log(`\n 4. reduced-motion: /cars @1800 -> click Cars`);
console.log(`    at 120ms ${reducedMid}, landed ${reducedEnd} -> ${reducedMid <= 2 ? "instant (correct)" : "still animating"}`);

await browser.close();
