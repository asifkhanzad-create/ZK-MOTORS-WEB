/**
 * One-off probe: is the React error #418 on the 404 page specific to the
 * vehicle detail route, or does every unknown route produce it?
 *
 * Usage: node qa/probe-404.mjs <baseUrl>
 */
import { chromium } from "playwright-core";

const BASE = (process.argv[2] ?? "http://localhost:3000").replace(/\/$/, "");

const ROUTES = [
  "/cars/this-car-does-not-exist",
  "/totally-bogus-route",
  "/cars/toyota-corolla-altis-grande-2021",
  "/cars",
];

const browser = await chromium.launch({ channel: "msedge", headless: true });
const page = await browser.newPage();

for (const route of ROUTES) {
  const errors = [];
  const onError = (err) => errors.push(err.message);
  page.on("pageerror", onError);

  const response = await page.goto(`${BASE}${route}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(400);

  console.log(
    `${route}\n  status=${response?.status()}  h1="${(await page.locator("h1").first().innerText()).trim()}"  pageerrors=${errors.length}${
      errors.length ? `\n    ${errors.map((e) => e.slice(0, 160)).join("\n    ")}` : ""
    }`,
  );

  page.off("pageerror", onError);
}

await browser.close();
