/**
 * ZK Motors — admin dashboard QA harness.
 *
 * The dashboard is the one part of the site where a mistake is not cosmetic.
 * Every other harness checks that a page looks right; this one checks that the
 * wrong person cannot get in, because the same controls that let the client edit
 * a price also let anyone else edit it.
 *
 * What it covers:
 *
 *   - every `/admin` route redirects a signed-out visitor, and carries where
 *     they were heading so signing in returns them there
 *   - the `next` parameter cannot be pointed at another origin — checked against
 *     the value the page actually renders, which is the value the action will
 *     receive, so this needs no credentials to be meaningful
 *   - the sign-in form is a real form with a real password field
 *   - a rejected sign-in produces one generic message rather than an
 *     account-enumeration oracle, and it does so through the genuine action,
 *     hitting the genuine Supabase Auth endpoint
 *   - admin responses are never cacheable, and never indexable
 *   - the marketing chrome is absent (see also `probe-admin-chrome.mjs`, which
 *     checks the DOM rather than the source)
 *
 * It does NOT cover the signed-in dashboard: listing stock, saving a car,
 * uploading a photo or the revalidation that follows. Those need a real account,
 * and are exercised by `qa-admin-authenticated.mjs` once one exists.
 *
 * Usage:
 *   node qa/qa-admin.mjs <baseUrl>
 */

import { chromium } from "playwright-core";

const base = process.argv[2] ?? "http://localhost:3000";

let failures = 0;
let checks = 0;

function check(ok, label, detail = "") {
  checks += 1;
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}${detail ? `  (${detail})` : ""}`);
  if (!ok) failures += 1;
}

/* -------------------------------------------------------------------------- */
/* Plain HTTP: redirects and headers                                           */
/* -------------------------------------------------------------------------- */

/** Fetch without following redirects, so the 307 itself is observable. */
async function head(path) {
  const response = await fetch(base + path, { redirect: "manual" });
  return {
    status: response.status,
    location: response.headers.get("location"),
    cacheControl: response.headers.get("cache-control"),
  };
}

console.log("\n== Signed-out visitors are redirected ==");

const protectedRoutes = [
  "/admin",
  "/admin/cars/new",
  "/admin/cars/toyota-corolla-altis-grande-2021",
];

for (const route of protectedRoutes) {
  const result = await head(route);
  check(
    result.status === 307 || result.status === 302,
    `${route} redirects`,
    `status ${result.status}`,
  );
  check(
    (result.location ?? "").startsWith("/admin/login"),
    `${route} redirects to the sign-in page`,
    result.location ?? "(no location)",
  );
  check(
    (result.cacheControl ?? "").includes("no-store"),
    `${route} is not cacheable`,
    result.cacheControl ?? "(none)",
  );
}

console.log("\n== The destination survives the redirect ==");
{
  const result = await head("/admin/cars/new?draft=1");
  const location = result.location ?? "";
  check(
    location.includes("next=") && decodeURIComponent(location).includes("/admin/cars/new?draft=1"),
    "the original destination is carried in `next`",
    location,
  );
}

console.log("\n== The sign-in page is reachable and is a real form ==");
const login = await head("/admin/login");
check(login.status === 200, "/admin/login returns 200", `status ${login.status}`);
check(
  (login.cacheControl ?? "").includes("no-store"),
  "/admin/login is not cacheable",
  login.cacheControl ?? "(none)",
);

const browser = await chromium.launch({ channel: "msedge" });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

/* Attached before the first navigation, not after. A listener added later only
   sees errors from that point on — which is how a harness ends up reporting "no
   console errors" while having navigated past several. */
const consoleErrors = [];
page.on("console", (message) => {
  if (message.type() === "error") consoleErrors.push(message.text());
});
page.on("pageerror", (error) => consoleErrors.push(String(error)));

try {
  await page.goto(`${base}/admin/login`, { waitUntil: "load" });

  const emailField = page.locator('input[name="email"]');
  const passwordField = page.locator('input[name="password"]');

  check(await emailField.count() === 1, "there is an email field");
  check(await passwordField.count() === 1, "there is a password field");
  check(
    (await passwordField.getAttribute("type")) === "password",
    "the password field is masked",
  );
  check(
    (await emailField.getAttribute("autocomplete")) === "username",
    "the email field is autofill-friendly",
  );

  /* The password must never be rendered back into the markup. */
  const html = await page.content();
  check(
    !/value="[^"]*"\s+[^>]*name="password"|name="password"[^>]*value="[^"]*"/.test(html),
    "the password field carries no value attribute",
  );

  /* ------------------------------------------------------------------------ */
  /* The open-redirect guard                                                   */
  /* ------------------------------------------------------------------------ */
  /* Asserted against the hidden field the page renders, which is exactly what
     the action will receive as `next`. No credentials needed: the value is
     sanitised on the way in, not on the way out. */

  console.log("\n== `next` cannot point at another origin ==");

  const nextCases = [
    { query: "/admin/login?next=https://evil.example.com", expect: "/admin", why: "absolute URL" },
    { query: "/admin/login?next=//evil.example.com", expect: "/admin", why: "protocol-relative" },
    { query: "/admin/login?next=/cars", expect: "/admin", why: "a public path" },
    { query: "/admin/login?next=/admin/cars/new", expect: "/admin/cars/new", why: "a real admin path" },
  ];

  for (const testCase of nextCases) {
    await page.goto(base + testCase.query, { waitUntil: "load" });
    const rendered = await page.locator('input[name="next"]').inputValue();
    check(
      rendered === testCase.expect,
      `${testCase.why} is refused`,
      `next="${rendered}"`,
    );
  }

  /* ------------------------------------------------------------------------ */
  /* A genuine rejected sign-in                                                */
  /* ------------------------------------------------------------------------ */

  console.log("\n== A rejected sign-in gives nothing away ==");

  await page.goto(`${base}/admin/login`, { waitUntil: "load" });
  await page.fill('input[name="email"]', "qa-harness-nobody@example.invalid");
  await page.fill('input[name="password"]', "not-the-right-password");
  await page.click('button[type="submit"]');

  /* Wait for an alert that has actual text in it, not merely for an alert to be
     visible. React commits the element and its text in separate steps often
     enough that "visible" can resolve while `innerText` is still empty — which
     read as "no error message shown" while the message was in fact there. */
  const alert = page.locator('[role="alert"]').filter({ hasText: /\S/ }).first();

  let message = "";
  try {
    await alert.waitFor({ state: "visible", timeout: 20_000 });
    message = (await alert.innerText()).trim();
  } catch {
    /* Leave `message` empty; the checks below report it. */
  }

  check(message.length > 0, "an error message is shown", message || "(nothing rendered)");

  /* Guarded on a non-empty message on purpose. `!/email/.test("")` is true, so
     running these against an empty string would report "no leak" while proving
     nothing at all — a green tick for a check that never happened. */
  if (message.length === 0) {
    check(false, "the leak checks could not run — there was no message to inspect");
    check(false, "the leak checks could not run — there was no message to inspect");
  } else {
    check(
      !/email|account|user|exist/i.test(message),
      "the message does not reveal whether the account exists",
      message,
    );
    check(
      !/password/i.test(message) || /not accepted|incorrect/i.test(message),
      "the message does not say which field was wrong",
      message,
    );
  }

  /* Still signed out: the dashboard must remain unreachable. */
  await page.goto(`${base}/admin`, { waitUntil: "load" });
  check(
    page.url().includes("/admin/login"),
    "a rejected sign-in leaves the dashboard locked",
    page.url(),
  );

  /* ------------------------------------------------------------------------ */
  /* Indexability                                                              */
  /* ------------------------------------------------------------------------ */

  console.log("\n== Not indexable ==");

  await page.goto(`${base}/admin/login`, { waitUntil: "load" });
  const robots = await page
    .locator('meta[name="robots"]')
    .first()
    .getAttribute("content");
  check(/noindex/i.test(robots ?? ""), "/admin/login is noindex", robots ?? "(none)");

  const sitemap = await (await fetch(`${base}/sitemap.xml`)).text();
  check(!sitemap.includes("/admin"), "the sitemap does not list /admin");

  const robotsTxt = await (await fetch(`${base}/robots.txt`)).text();
  check(
    /disallow:\s*\/admin/i.test(robotsTxt),
    "robots.txt disallows /admin",
    robotsTxt.replace(/\s+/g, " ").trim(),
  );

  /* ------------------------------------------------------------------------ */
  /* Console                                                                   */
  /* ------------------------------------------------------------------------ */

  console.log("\n== Console ==");
  /* The listener has been attached since before the first navigation, so this
     covers every page visited above — including the rejected sign-in, which is
     where a hydration or action error would show up. */
  await page.waitForTimeout(500);
  check(
    consoleErrors.length === 0,
    "no console or page errors across the run",
    consoleErrors.join(" | "),
  );
} finally {
  await browser.close();
}

console.log(
  `\n${failures === 0 ? "All checks passed." : `${failures} of ${checks} check(s) FAILED.`}\n`,
);
process.exit(failures === 0 ? 0 : 1);
