/**
 * Throwaway probe: (1) what is actually making the header 90px instead of the
 * 80px I calculated, and (2) what overflows at a 360px viewport.
 */
import { chromium } from "playwright-core";

const browser = await chromium.launch({ channel: "msedge", headless: true });
const page = await browser.newPage();
await page.goto("http://localhost:3000/", { waitUntil: "networkidle" });

async function report(width) {
  await page.setViewportSize({ width, height: 900 });
  await page.goto("http://localhost:3000/", { waitUntil: "networkidle" });
  await page.evaluate(() => {
    document.documentElement.style.scrollBehavior = "auto";
  });

  const data = await page.evaluate(() => {
    const header = document.querySelector("header");
    const capsule = header.querySelector('nav[aria-label="Main"]');
    const inner = header.firstElementChild;

    const measure = (el) => {
      const r = el.getBoundingClientRect();
      return {
        tag: el.tagName.toLowerCase(),
        cls: (el.className?.toString() ?? "").slice(0, 55),
        w: Math.round(r.width),
        h: Math.round(r.height),
      };
    };

    const cs = getComputedStyle(header);
    const capsuleCs = getComputedStyle(capsule);

    return {
      headerHeight: Math.round(header.getBoundingClientRect().height),
      headerPadding: `${cs.paddingTop} / ${cs.paddingBottom}`,
      innerHeight: Math.round(inner.getBoundingClientRect().height),
      capsuleHeight: Math.round(capsule.getBoundingClientRect().height),
      capsulePadding: `${capsuleCs.paddingTop} / ${capsuleCs.paddingBottom}`,
      children: [...capsule.children].map(measure),
      docScrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
      offenders: [...document.querySelectorAll("*")]
        .filter((el) => {
          const r = el.getBoundingClientRect();
          return r.width > 0 && (r.right > window.innerWidth + 1 || r.left < -1);
        })
        .slice(0, 10)
        .map((el) => {
          const r = el.getBoundingClientRect();
          return {
            tag: el.tagName.toLowerCase(),
            cls: (el.className?.toString() ?? "").slice(0, 70),
            left: Math.round(r.left),
            right: Math.round(r.right),
          };
        }),
    };
  });

  console.log(`\n===== viewport ${width} =====`);
  console.log(JSON.stringify(data, null, 2));
}

await report(1440);
await report(360);

await browser.close();
