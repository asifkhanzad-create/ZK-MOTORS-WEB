/**
 * ZK Motors — focus-ring clipping harness.
 *
 * The site draws its focus ring globally in `globals.css`:
 *
 *     :focus-visible { outline: 2px solid accent-500; outline-offset: 3px }
 *
 * That ring is 5px wide and sits *outside* the element's border box. Any ancestor
 * with an `overflow` other than `visible` clips it at its own padding box — and
 * `overflow-y: auto` is enough on its own, because CSS forces the other axis to
 * compute to `auto` too. So a vertical scroll container silently eats the left
 * and right of every ring inside it.
 *
 * That is how the `/cars` sidebar lost the sides of its keyword field's ring:
 * `overflow-y-auto` with `pr-1` and no left padding. It is invisible to a mouse
 * user, because the ring is only drawn for keyboard focus — which is precisely
 * the person who needs it.
 *
 * **The padding box is not the whole story on the right — the scrollbar is.**
 * Padding the `/cars` content 8px clear of the padding box fixed the left side and
 * still left the ring 12px *inside* the scrollbar, because on Windows Edge draws
 * an overlay scrollbar: zero layout space, floating over the last 15px of the
 * scrollport. So the effective right boundary of a scroll container is
 * `paddingBoxRight - scrollbarWidth`, and this harness measures that, not the
 * padding box. It also reports the scrollbar width it used, so a failure says
 * which boundary was missed.
 *
 * This harness **tabs through the page** and measures the ring on whichever
 * element currently has focus. That is slower than reading the geometry up front,
 * but the up-front version does not work: the ring is only applied under
 * `:focus-visible`, so an unfocused element reports `outline-style: none` and
 * `outline-width: 0`, and a harness that reads those sees a reach of zero and
 * skips every element on the page. That version reported 16/16 while the `/cars`
 * keyword field was visibly clipped. Real Tab presses are what make the ring
 * exist at all — and they also prove the control is reachable by keyboard, which
 * is the only audience a focus ring has.
 *
 * Elements that are already scrolled out of their container are skipped: their
 * clipping is correct and expected, and the check is about a ring being cut off
 * while the control is fully visible.
 *
 * Usage:
 *   node qa/qa-focus-ring.mjs [baseUrl]
 */

import { chromium } from "playwright-core";

const base = process.argv[2] ?? "http://localhost:3000";

const ROUTES = [
  "/",
  "/cars",
  "/cars/toyota-corolla-altis-grande-2021",
  "/sell-your-car",
  "/about",
  "/contact",
  "/privacy",
  "/terms",
];

const VIEWPORTS = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "mobile", width: 390, height: 844 },
];

/** Generous: the homepage is link-heavy. The loop stops early on wrap-around. */
const MAX_TABS = 160;

let failures = 0;
let checks = 0;

function check(ok, label, detail = "") {
  checks += 1;
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}${detail ? `  (${detail})` : ""}`);
  if (!ok) failures += 1;
}

/**
 * Runs in the page against whatever currently has focus. Returns a problem
 * entry if the focused element's ring would be clipped, or a reason to skip.
 */
function inspectFocused() {
  const el = document.activeElement;
  if (!el || el === document.body || el === document.documentElement) return { skip: "no focus" };

  /* A stable per-element id, so the tab loop can tell "already visited" from
     "a different element that happens to have no ring". Deduplicating on the
     skip *reason* instead stopped the loop at the first ring-less element —
     every later one matched the same string and was skipped, so the harness
     reported "1 control checked" on most pages while claiming to pass. */
  if (!el.__qaFocusId) {
    window.__qaFocusSeq = (window.__qaFocusSeq || 0) + 1;
    el.__qaFocusId = window.__qaFocusSeq;
  }
  const id = el.__qaFocusId;

  const style = getComputedStyle(el);

  /* Read the ring from the focused element, where the rule actually applies. */
  const reach =
    parseFloat(style.outlineOffset || "0") + parseFloat(style.outlineWidth || "0");
  if (style.outlineStyle === "none" || !(reach > 0)) {
    return { id, skip: "no ring on this element" };
  }

  const describe = (node) => {
    const nodeId = node.id ? `#${node.id}` : "";
    const name = node.getAttribute?.("name") ? `[name="${node.getAttribute("name")}"]` : "";
    const cls = (node.className || "").toString().trim().split(/\s+/).slice(0, 3).join(".");
    return `${node.tagName.toLowerCase()}${nodeId}${name}${cls ? `.${cls}` : ""}`;
  };

  const box = el.getBoundingClientRect();

  /* How wide is this container's vertical scrollbar? `offsetWidth - clientWidth`
     answers that for a classic scrollbar, but an *overlay* scrollbar (Windows
     with "automatically hide scroll bars", which is what this machine does)
     takes zero layout space and reports 0 — while still floating over the last
     ~15px of the scrollport. That is precisely the case the previous version of
     this check could not see, so it passed while the ring sat under the bar.
     Forcing `scrollbar-gutter: stable` reserves the gutter, and the same
     subtraction then reports the width the browser actually uses. */
  const scrollbarWidth = (node, s) => {
    const borders = parseFloat(s.borderLeftWidth) + parseFloat(s.borderRightWidth);
    const direct = node.offsetWidth - node.clientWidth - borders;
    if (direct > 0) return direct;
    if (s.overflowY !== "auto" && s.overflowY !== "scroll") return 0;
    if (node.scrollHeight <= node.clientHeight) return 0;
    const previous = node.style.scrollbarGutter;
    node.style.scrollbarGutter = "stable";
    const forced = node.offsetWidth - node.clientWidth - borders;
    node.style.scrollbarGutter = previous;
    return forced;
  };

  for (let node = el.parentElement; node && node !== document.documentElement; node = node.parentElement) {
    const s = getComputedStyle(node);
    if (s.overflowX === "visible" && s.overflowY === "visible") continue;

    const r = node.getBoundingClientRect();

    /* Scrolled out of view: the clipping is correct, not a bug. */
    const inside =
      box.left >= r.left - 0.5 &&
      box.right <= r.right + 0.5 &&
      box.top >= r.top - 0.5 &&
      box.bottom <= r.bottom + 0.5;
    if (!inside) continue;

    const padBoxLeft = r.left + parseFloat(s.borderLeftWidth);
    const padBoxRight = r.right - parseFloat(s.borderRightWidth);
    const padBoxTop = r.top + parseFloat(s.borderTopWidth);
    const padBoxBottom = r.bottom - parseFloat(s.borderBottomWidth);

    /* The scrollbar owns the last `bar` px of the scrollport, so the right
       boundary is inside the padding box, not at it. (A horizontal scrollbar
       would do the same at the bottom, but only classic ones report a width
       here — an overlay horizontal bar is not measured.) */
    const bar = scrollbarWidth(node, s);

    const clearance = {
      left: box.left - padBoxLeft,
      right: padBoxRight - bar - box.right,
      top: box.top - padBoxTop,
      bottom: padBoxBottom - box.bottom,
    };

    const cut = Object.entries(clearance)
      .filter(([, value]) => value < reach)
      .map(([side, value]) => `${side} ${value.toFixed(0)}<${reach}`);

    if (cut.length) {
      return {
        id,
        element: describe(el),
        clipper: describe(node),
        overflow: `${s.overflowX}/${s.overflowY}`,
        padding: `${s.paddingLeft}/${s.paddingRight}/${s.paddingTop}/${s.paddingBottom}`,
        scrollbar: `${bar}px`,
        cut: cut.join(", "),
      };
    }
  }

  return { id, ok: describe(el) };
}

const browser = await chromium.launch({ channel: "msedge" });

/**
 * Self-test. Every check in this file is a negative assertion — "no ring is
 * clipped" — and this project has now shipped six checks that passed while the
 * bug was visible on screen, so a green run has to be shown to be capable of
 * going red. This puts the `/cars` sidebar back to the style that caused the
 * reported bug and asserts that `inspectFocused` reports a cut. If it does not,
 * the harness is broken and its 16/16 means nothing.
 */
async function selfTest() {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  try {
    await page.goto(base + "/cars", { waitUntil: "load" });

    const revert = (on) =>
      page.evaluate((shouldRevert) => {
        const el = document.querySelector("aside input");
        if (!el) return false;
        el.focus();
        let scroller = el.parentElement;
        while (scroller) {
          const s = getComputedStyle(scroller);
          if (s.overflowY !== "visible" && s.overflowY !== "clip") break;
          scroller = scroller.parentElement;
        }
        if (!scroller) return false;
        if (shouldRevert) {
          scroller.dataset.qaSaved = scroller.getAttribute("class") ?? "";
          scroller.style.scrollbarGutter = "auto";
          scroller.style.marginLeft = "0px";
          scroller.style.marginRight = "0px";
          scroller.style.paddingLeft = "0px";
          scroller.style.paddingRight = "4px";
        } else {
          scroller.style.scrollbarGutter = "";
          scroller.style.marginLeft = "";
          scroller.style.marginRight = "";
          scroller.style.paddingLeft = "";
          scroller.style.paddingRight = "";
        }
        return true;
      }, on);

    if (!(await revert(false))) {
      check(false, "self-test — could not reach the /cars sidebar scroller");
      return;
    }

    const healthy = await page.evaluate(inspectFocused);
    check(
      !healthy.element,
      "self-test — the shipped sidebar is reported clean",
      healthy.element ? `${healthy.element} cut: ${healthy.cut}` : "no ring clipped",
    );

    await revert(true);
    const broken = await page.evaluate(inspectFocused);
    check(
      Boolean(broken.element),
      "self-test — the pre-fix sidebar IS reported clipped (the check can fail)",
      broken.element ? `cut: ${broken.cut}  scrollbar ${broken.scrollbar}` : "no problem reported — the harness cannot fail",
    );

    await revert(false);
  } finally {
    await page.close();
  }
}

try {
  await selfTest();
  console.log("");

  for (const viewport of VIEWPORTS) {
    console.log(`\n== ${viewport.name} (${viewport.width}×${viewport.height}) ==`);

    const page = await browser.newPage({
      viewport: { width: viewport.width, height: viewport.height },
    });

    for (const route of ROUTES) {
      await page.goto(base + route, { waitUntil: "load" });

      /* Start from the top of the document so Tab begins at the first control. */
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.locator("body").click({ position: { x: 2, y: 2 } }).catch(() => {});

      const problems = new Map();
      const seen = new Set();
      let visited = 0;
      let ringless = 0;

      for (let i = 0; i < MAX_TABS; i += 1) {
        await page.keyboard.press("Tab");

        const result = await page.evaluate(inspectFocused);

        /* Focus left the document — past the last control. */
        if (result.skip === "no focus") break;

        /* Back to something we have already inspected: the tab ring wrapped. */
        if (seen.has(result.id)) break;
        seen.add(result.id);

        if (result.skip) ringless += 1;
        else if (result.ok) visited += 1;
        else if (result.element) problems.set(`${result.element}|${result.clipper}`, result);
      }

      const found = [...problems.values()];

      check(
        found.length === 0,
        `${route} — no focus ring is clipped`,
        found.length
          ? `${found.length} clipped, ${visited} clean, ${ringless} without a ring`
          : `${visited} clean, ${ringless} without a ring`,
      );

      for (const p of found.slice(0, 6)) {
        console.log(`        ${p.element}`);
        console.log(
          `          clipped by ${p.clipper}  overflow ${p.overflow}  pad ${p.padding}  scrollbar ${p.scrollbar}`,
        );
        console.log(`          cut: ${p.cut}`);
      }
      if (found.length > 6) console.log(`        … and ${found.length - 6} more`);
    }

    await page.close();
  }
} finally {
  await browser.close();
}

console.log(`\n${checks - failures}/${checks} checks passed.\n`);
process.exit(failures === 0 ? 0 : 1);
