/**
 * Throwaway probe: what does getComputedStyle() actually return for the
 * capsule's Tailwind `bg-ink-950/85` and for a nav link's `text-muted-dark`?
 * Node's naive "grab the numbers" parse assumed rgb()/rgba().
 */
import { chromium } from "playwright-core";

const browser = await chromium.launch({ channel: "msedge", headless: true });
const page = await browser.newPage();
await page.goto("http://localhost:3000/", { waitUntil: "networkidle" });

const out = await page.evaluate(() => {
  const capsule = document.querySelector('header nav[aria-label="Main"]');
  const link = document.querySelector('header nav[aria-label="Main"] ul a');
  const wordmark = document.querySelector('header nav[aria-label="Main"] > a');
  return {
    capsuleBg: getComputedStyle(capsule).backgroundColor,
    linkColor: getComputedStyle(link).color,
    wordmarkColor: getComputedStyle(wordmark).color,
    linkText: link.textContent,
    linkCurrent: link.getAttribute("aria-current"),
  };
});

console.log(JSON.stringify(out, null, 2));
await browser.close();
