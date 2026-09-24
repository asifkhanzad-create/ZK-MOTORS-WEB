/**
 * Does the page cross-fade fire where it should, and stay away where it
 * should not?
 *
 * `document.startViewTransition` is the single choke point React's
 * `<ViewTransition>` goes through, so counting calls to it tells us exactly
 * when a transition ran. The two cases that matter:
 *
 *   route change   -> MUST transition (that is the whole point)
 *   /cars filter   -> MUST NOT transition (`cars/page.tsx` rejects exactly
 *                     this fade as "flicker rather than polish")
 *
 *   node qa/probe-viewtransition.mjs http://localhost:3000
 */
import { chromium } from "playwright-core";

const base = process.argv[2] ?? "http://localhost:3000";
const browser = await chromium.launch({ channel: "msedge", headless: true });

let failures = 0;
function check(ok, label, detail = "") {
  if (!ok) failures++;
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}${detail ? `  (${detail})` : ""}`);
}

/** Counts every view transition the page starts. */
const COUNTER = () => {
  window.__vt = { calls: 0, unsupported: typeof document.startViewTransition !== "function" };
  const original = document.startViewTransition;
  if (typeof original !== "function") return;
  document.startViewTransition = function (arg) {
    window.__vt.calls++;
    return original.call(document, arg);
  };
};

const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const errors = [];
page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
await page.addInitScript(COUNTER);

const reset = () => page.evaluate(() => { window.__vt.calls = 0; });
const calls = () => page.evaluate(() => window.__vt.calls);
const nav = () => page.locator('header nav[aria-label="Main"]');

await page.goto(`${base}/`, { waitUntil: "load" });

console.log("\n== Browser support ==");
check(!(await page.evaluate(() => window.__vt.unsupported)), "the browser exposes startViewTransition");

console.log("\n== Route changes must cross-fade ==");
await reset();
await nav().getByRole("link", { name: "Cars", exact: true }).click();
await page.waitForURL(/\/cars$/);
await page.waitForTimeout(700);
check((await calls()) >= 1, "home -> /cars starts a view transition", `${await calls()} call(s)`);

await reset();
await page.locator('a[href="/cars/toyota-corolla-altis-grande-2021"]').first().click();
await page.waitForURL(/\/cars\/toyota-corolla-altis-grande-2021$/);
await page.waitForTimeout(700);
check((await calls()) >= 1, "/cars -> detail starts a view transition", `${await calls()} call(s)`);

await reset();
await nav().getByRole("link", { name: "Home", exact: true }).click();
await page.waitForURL((u) => u.pathname === "/");
await page.waitForTimeout(700);
check((await calls()) >= 1, "detail -> home starts a view transition", `${await calls()} call(s)`);

console.log("\n== Filter changes must NOT cross-fade ==");
await page.goto(`${base}/cars`, { waitUntil: "load" });
await reset();
await page.getByRole("link", { name: "SUV", exact: true }).first().click();
await page.waitForURL(/bodyType=SUV/);
await page.waitForTimeout(700);
check((await calls()) === 0, "a body-type pill does not start a view transition", `${await calls()} call(s)`);

await reset();
await page
  .getByRole("complementary", { name: /filter cars/i })
  .getByLabel("Make", { exact: true })
  .selectOption("Toyota");
await page.waitForURL(/make=Toyota/);
await page.waitForTimeout(700);
check((await calls()) === 0, "the make select does not start a view transition", `${await calls()} call(s)`);

console.log("\n== Same-route nav click must NOT cross-fade ==");
await page.evaluate(() => window.scrollTo(0, 1800));
await reset();
await nav().getByRole("link", { name: "Cars", exact: true }).click();
await page.waitForTimeout(900);
check((await calls()) === 0, "clicking Cars while on /cars starts no transition", `${await calls()} call(s)`);
check(
  (await page.evaluate(() => Math.round(window.scrollY))) <= 2,
  "…and still scrolls to the top",
  `scrollY ${await page.evaluate(() => Math.round(window.scrollY))}`,
);

console.log("\n== Reduced motion ==");
const reduced = await browser.newContext({ reducedMotion: "reduce", viewport: { width: 1280, height: 800 } });
const rp = await reduced.newPage();
await rp.addInitScript(() => {
  window.__vtDurations = [];
  const original = document.startViewTransition;
  if (typeof original !== "function") return;
  document.startViewTransition = function (arg) {
    const t = original.call(document, arg);
    /* Sample the pseudo-elements once they exist. */
    setTimeout(() => {
      for (const sel of ["::view-transition-old(root)", "::view-transition-new(root)"]) {
        try {
          window.__vtDurations.push(getComputedStyle(document.documentElement, sel).animationDuration);
        } catch {
          /* pseudo-element not present */
        }
      }
    }, 30);
    return t;
  };
});
await rp.goto(`${base}/`, { waitUntil: "load" });
await rp.locator('header nav[aria-label="Main"]').getByRole("link", { name: "Cars", exact: true }).click();
await rp.waitForURL(/\/cars$/);
await rp.waitForTimeout(700);
const durations = await rp.evaluate(() => window.__vtDurations ?? []);
const allZero = durations.length > 0 && durations.every((d) => d === "0s" || parseFloat(d) === 0);
check(allZero, "reduced-motion zeroes the cross-fade duration", durations.join(", ") || "no samples");

console.log("\n== Console ==");
check(errors.length === 0, "no console errors or page errors", errors.slice(0, 3).join(" | "));

await browser.close();
console.log(`\n${failures === 0 ? "All checks passed." : `${failures} check(s) FAILED.`}\n`);
process.exit(failures === 0 ? 0 : 1);
