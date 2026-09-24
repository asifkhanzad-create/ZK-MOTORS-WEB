/**
 * Why did the alert read as empty?
 *
 * Submits bad credentials to the real form and dumps what is actually in the DOM
 * afterwards — the alert's outerHTML, its computed text, and every element that
 * carries an alert-ish role or live region.
 */
import { chromium } from "playwright-core";

const base = process.argv[2] ?? "http://localhost:3000";
const browser = await chromium.launch({ channel: "msedge" });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

page.on("console", (m) => console.log(`  [console:${m.type()}] ${m.text()}`));
page.on("pageerror", (e) => console.log(`  [pageerror] ${e}`));

await page.goto(`${base}/admin/login`, { waitUntil: "load" });
await page.fill('input[name="email"]', "qa-harness-nobody@example.invalid");
await page.fill('input[name="password"]', "not-the-right-password");

console.log("submitting…");
await page.click('button[type="submit"]');

await page.waitForTimeout(6000);

const dump = await page.evaluate(() => {
  const nodes = [
    ...document.querySelectorAll('[role="alert"], [aria-live], .text-signal-600'),
  ];
  return {
    url: location.href,
    alertCount: document.querySelectorAll('[role="alert"]').length,
    nodes: nodes.map((n) => ({
      tag: n.tagName,
      role: n.getAttribute("role"),
      live: n.getAttribute("aria-live"),
      text: (n.textContent ?? "").trim().slice(0, 160),
      html: n.outerHTML.slice(0, 300),
    })),
    /* Everything inside the card, to see what the form rendered instead. */
    cardText: (document.querySelector("form")?.textContent ?? "").trim().slice(0, 400),
  };
});

console.log(JSON.stringify(dump, null, 2));
await browser.close();
