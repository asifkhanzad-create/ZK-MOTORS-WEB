/**
 * Throwaway probe #2: is the global `html { scroll-behavior: smooth }` the
 * reason a cross-route nav click lands at scrollY 131 instead of 0?
 *
 * Runs the same click twice: once with the project's smooth scrolling in place,
 * once with it forced to `auto` before the click.
 */
import { chromium } from "playwright-core";

const browser = await chromium.launch({ channel: "msedge", headless: true });
const page = await browser.newPage();
await page.setViewportSize({ width: 1280, height: 800 });

const carsLink = () => page.locator('header nav[aria-label="Main"]').getByRole("link", { name: "Cars", exact: true });

async function trace(label, disableSmooth) {
  await page.goto("http://localhost:3000/", { waitUntil: "networkidle" });
  await page.evaluate(() => window.scrollTo(0, 2400));
  await page.waitForTimeout(400);

  if (disableSmooth) {
    await page.evaluate(() => {
      document.documentElement.style.scrollBehavior = "auto";
    });
  }

  await carsLink().click();

  const samples = [];
  for (let t = 0; t < 900; t += 60) {
    samples.push(await page.evaluate(() => Math.round(window.scrollY)));
    await page.waitForTimeout(60);
  }

  console.log(`\n  ${label}`);
  console.log(`    scroll-behavior = ${await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior)}`);
  console.log(`    ${samples.join(" -> ")}`);
  console.log(`    landed at ${samples[samples.length - 1]}, url ${page.url()}`);
}

await trace("A: project default (smooth)", false);
await trace("B: smooth forced off before the click", true);

/* And the same-route case, with smooth off, to see if Next scrolls at all. */
console.log("\n  C: already on /cars, click Cars, smooth off");
await page.goto("http://localhost:3000/cars", { waitUntil: "networkidle" });
await page.evaluate(() => {
  document.documentElement.style.scrollBehavior = "auto";
  window.scrollTo(0, 1800);
});
await page.waitForTimeout(300);
await carsLink().click();
await page.waitForTimeout(600);
console.log(`    landed at ${await page.evaluate(() => Math.round(window.scrollY))} (started at 1800)`);

await browser.close();
