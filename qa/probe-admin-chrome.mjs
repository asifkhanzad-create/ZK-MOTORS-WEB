/**
 * Does the marketing chrome actually leave the DOM on /admin?
 *
 * A plain `curl | grep` cannot answer this. The admin layout's children are
 * server-rendered and travel to the client inside the inline RSC payload
 * (`self.__next_f.push`), so the markup for the header, the footer and the
 * structured-data script appears in the page *source* even when the client
 * component that owns them has decided not to render them. Only a real DOM
 * distinguishes "in the payload" from "on the page".
 */
import { chromium } from "playwright-core";

const base = process.argv[2] ?? "http://localhost:3000";

const browser = await chromium.launch({ channel: "msedge" });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

let failures = 0;
let checks = 0;
function check(ok, label, detail = "") {
  checks += 1;
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}${detail ? `  (${detail})` : ""}`);
  if (!ok) failures += 1;
}

async function probe(path) {
  await page.goto(base + path, { waitUntil: "load" });
  return page.evaluate(() => ({
    header: Boolean(document.querySelector("header")),
    footer: Boolean(document.querySelector("footer")),
    navLinks: document.querySelectorAll('a[href="/cars"]').length,
    whatsapp: document.querySelectorAll('a[href*="wa.me"]').length,
    ldJson: [...document.querySelectorAll('script[type="application/ld+json"]')].some((s) =>
      s.textContent.includes("AutoDealer"),
    ),
    title: document.title,
    /* Read here, in the same evaluate as the navigation. Reading it afterwards
       from the outer scope silently reports whatever page was visited last —
       which is how this check first "failed" against the homepage's
       `index, follow` instead of the login page's `noindex`. */
    robots: [...document.querySelectorAll('meta[name="robots"]')]
      .map((m) => m.content)
      .join(" | "),
  }));
}

console.log("\n== /admin/login must have NO marketing chrome ==");
const login = await probe("/admin/login");
check(!login.header, "no <header> in the DOM", `found=${login.header}`);
check(!login.footer, "no <footer> in the DOM", `found=${login.footer}`);
check(login.navLinks === 0, "no navbar links to /cars", `found=${login.navLinks}`);
check(login.whatsapp === 0, "no floating WhatsApp button", `found=${login.whatsapp}`);
check(!login.ldJson, "no AutoDealer structured data", `found=${login.ldJson}`);

console.log("\n== the same chrome MUST be present on a public page ==");
const home = await probe("/");
check(home.header, "homepage has a <header>", `found=${home.header}`);
check(home.footer, "homepage has a <footer>", `found=${home.footer}`);
check(home.navLinks > 0, "homepage has navbar links to /cars", `found=${home.navLinks}`);
check(home.whatsapp > 0, "homepage has the WhatsApp button", `found=${home.whatsapp}`);
check(home.ldJson, "homepage has AutoDealer structured data", `found=${home.ldJson}`);

console.log("\n== the admin must not be indexable ==");
check(
  /noindex/i.test(login.robots),
  "/admin/login is noindex",
  login.robots || "(no robots meta)",
);
check(
  /noindex/i.test(home.robots) === false,
  "the homepage is still indexable (the override did not leak)",
  home.robots || "(no robots meta)",
);
check(
  login.title.startsWith("Sign in"),
  "/admin/login has its own title",
  login.title,
);

console.log(`\n${checks - failures}/${checks} checks passed.\n`);

await browser.close();
process.exit(failures === 0 ? 0 : 1);
