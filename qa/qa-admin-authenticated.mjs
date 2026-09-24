/**
 * ZK Motors — the signed-in round trip through the admin dashboard.
 *
 * `qa-admin.mjs` proves the wrong person cannot get in. This one proves the
 * right person can actually do the job, which is a different claim and needs a
 * real account.
 *
 * It walks one car through its whole life and checks the public site after every
 * step, because the dashboard is only correct if the website changes to match:
 *
 *   sign in → add a car → it appears on /cars → edit the price → the public page
 *   updates → unpublish → gone from the site but STILL in the dashboard →
 *   publish → back → mark sold → the public page says so → delete → gone from
 *   both → sign out
 *
 * ## The unpublish step is the important one
 *
 * `0001`'s select policy is `using (published = true)` with no `to` clause, so it
 * applies to `authenticated` as well. Until `0002_admin_access.sql` runs, an
 * admin can *write* a draft but cannot *read* it — so unpublishing a car makes it
 * disappear from the dashboard too, which looks exactly like deletion. That check
 * is the only thing here that can detect the missing migration, and it is why
 * this step asserts on the dashboard as well as the site.
 *
 * ## What it writes
 *
 * It creates a real row in the real database and a real object in the real
 * bucket, both named `qa-roundtrip-test-car`, and deletes the row at the end.
 * The photo is deliberately left in Storage: that is what the app itself does
 * (see `deleteVehicle`), so the test does not paper over the behaviour. Run it
 * against a project whose stock you can afford to disturb.
 *
 * Usage:
 *   # add QA_ADMIN_EMAIL / QA_ADMIN_PASSWORD to .env.local, then:
 *   node --env-file=.env.local qa/qa-admin-authenticated.mjs [baseUrl]
 *
 * Reading them from `.env.local` is preferred over passing them on the command
 * line: the file is already gitignored, the password never reaches your shell
 * history or the process list, and no quoting is needed for special characters.
 */

import { copyFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { chromium } from "playwright-core";

const base = process.argv[2] ?? "http://localhost:3000";
const email = process.env.QA_ADMIN_EMAIL;
const password = process.env.QA_ADMIN_PASSWORD;

if (!email || !password) {
  console.error(
    "\n  Missing QA_ADMIN_EMAIL / QA_ADMIN_PASSWORD.\n\n" +
      "  This harness signs in for real, so it needs an account. Add two lines to\n" +
      "  .env.local — it is gitignored, so the password stays out of your shell\n" +
      "  history, this chat, and the repository:\n\n" +
      "      QA_ADMIN_EMAIL=someone@gmail.com\n" +
      "      QA_ADMIN_PASSWORD=the-password-you-set\n\n" +
      "  Then run it with --env-file, which is how this project runs\n" +
      "  qa/probe-supabase.mjs too:\n\n" +
      "      node --env-file=.env.local qa/qa-admin-authenticated.mjs\n\n" +
      "  The account must be confirmed. Supabase turns email confirmation on by\n" +
      "  default for hosted projects, so tick “Auto Confirm User” when creating it\n" +
      "  — without that the account exists but cannot sign in, and the app reports\n" +
      "  that as a generic credential failure, which reads as “wrong password”.\n",
  );
  process.exit(2);
}

/** The car this run creates and removes. Fixed, so a crashed run leaves an
 *  obvious orphan rather than a mystery listing. */
const SLUG = "qa-roundtrip-test-car";

let failures = 0;
let checks = 0;

function check(ok, label, detail = "") {
  checks += 1;
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}${detail ? `  (${detail})` : ""}`);
  if (!ok) failures += 1;
}

/** The rendered HTML of a public page, for assertions about what a visitor sees. */
async function html(pathname) {
  const response = await fetch(base + pathname);
  return { status: response.status, body: await response.text() };
}

/* -------------------------------------------------------------------------- */
/* A real photo, so the upload path is exercised rather than mocked            */
/* -------------------------------------------------------------------------- */

const photoSource = path.join(process.cwd(), "public", "vehicles", "bmw-x3.jpg");
if (!existsSync(photoSource)) {
  console.error(`\n  Missing ${photoSource} — the upload test needs a real image.\n`);
  process.exit(2);
}
const photo = path.join(tmpdir(), "zk-qa-roundtrip-photo.jpg");
copyFileSync(photoSource, photo);

/* -------------------------------------------------------------------------- */
/* Browser                                                                     */
/* -------------------------------------------------------------------------- */

const browser = await chromium.launch({ channel: "msedge" });
const page = await browser.newPage();

/* Every step below is a navigation, and `load` is deliberate — the homepage
   prefetch that every page fires never settles, so `networkidle` waits forever. */
const goto = (pathname) => page.goto(base + pathname, { waitUntil: "load" });

/** The stock row for a given car, found by its Edit link — stable across layout. */
const rowFor = (slug) => page.locator("li").filter({ has: page.locator(`a[href="/admin/cars/${slug}"]`) });

try {
  /* ---------------------------------------------------------------------- */
  console.log("\n== Signing in ==");
  /* ---------------------------------------------------------------------- */

  await goto("/admin/login");
  await page.fill("#admin-email", email);
  await page.fill("#admin-password", password);
  await Promise.all([
    page.waitForURL((url) => !url.pathname.startsWith("/admin/login"), { timeout: 20000 }),
    page.getByRole("button", { name: "Sign in" }).click(),
  ]);

  const signedInUrl = new URL(page.url());
  check(signedInUrl.pathname === "/admin", "signing in lands on the dashboard", signedInUrl.pathname);

  const alerts = await page.locator('[role="alert"]').allInnerTexts();
  check(
    alerts.length === 0,
    "no sign-in error is shown",
    alerts.length ? alerts.join(" | ") : "none",
  );

  const bodyText = await page.locator("body").innerText();
  check(bodyText.includes(email), "the dashboard names the signed-in account", email);

  /* If the account is unconfirmed or the password is wrong, the redirect never
     happens and every later step fails confusingly. Stop here with a clear
     reason instead. */
  if (signedInUrl.pathname.startsWith("/admin/login")) {
    console.log(`\n  Stopped: still on the sign-in page.  ${alerts.join(" | ")}\n`);
    await browser.close();
    process.exit(1);
  }

  /* ---------------------------------------------------------------------- */
  console.log("\n== Adding a car ==");
  /* ---------------------------------------------------------------------- */

  await goto("/admin/cars/new");
  check(
    (await page.locator('input[name="mode"]').inputValue()) === "create",
    "the form is in create mode",
  );
  check(
    await page.locator('input[name="published"]').isChecked(),
    "a new car is published by default",
  );

  await page.fill('input[name="make"]', "QA Roundtrip");
  await page.fill('input[name="model"]', "Test Car");
  await page.fill('input[name="year"]', "2020");
  await page.selectOption('select[name="transmission"]', "Automatic");
  await page.selectOption('select[name="fuel"]', "Petrol");
  await page.selectOption('select[name="bodyType"]', "Sedan");
  await page.fill('input[name="registrationCity"]', "Islamabad");
  await page.fill('input[name="price"]', "1000000");
  await page.fill('input[name="mileage"]', "50000");
  await page.fill('input[name="imageAlt"]', "QA test car, front view");
  await page.fill('input[name="id"]', SLUG);
  await page.setInputFiles('input[name="photo"]', photo);

  await Promise.all([
    page.waitForURL((url) => url.pathname === "/admin", { timeout: 30000 }),
    page.getByRole("button", { name: "Add the car" }).click(),
  ]);

  const savedFlash = await page.locator('[role="status"]').innerText();
  check(
    savedFlash.includes(`Saved “${SLUG}”`),
    "saving confirms with the car's address",
    savedFlash.trim(),
  );

  const createdRow = rowFor(SLUG);
  check(await createdRow.count() === 1, "the new car is listed in the dashboard");

  /* ---------------------------------------------------------------------- */
  console.log("\n== It reaches the public site ==");
  /* ---------------------------------------------------------------------- */

  const listing = await html("/cars");
  check(
    listing.body.includes(`/cars/${SLUG}`),
    "/cars links to the new car",
  );

  const detail = await html(`/cars/${SLUG}`);
  check(detail.status === 200, "the car's own page returns 200", String(detail.status));
  check(
    detail.body.includes("1,000,000") || detail.body.includes("10,00,000"),
    "the detail page shows the price",
  );
  check(
    detail.body.includes(`storage/v1/object/public/vehicle-photos/${SLUG}-`),
    "the photo was uploaded to Storage and is the one being served",
  );

  /* ---------------------------------------------------------------------- */
  console.log("\n== An edit reaches the public site ==");
  /* ---------------------------------------------------------------------- */

  await goto(`/admin/cars/${SLUG}`);
  check(
    await page.locator('input[name="id"]').isEditable() === false,
    "the address is read-only when editing",
  );
  await page.fill('input[name="price"]', "1250000");
  await Promise.all([
    page.waitForURL((url) => url.pathname === "/admin", { timeout: 30000 }),
    page.getByRole("button", { name: "Save changes" }).click(),
  ]);

  const edited = await html(`/cars/${SLUG}`);
  check(
    edited.body.includes("1,250,000") || edited.body.includes("12,50,000"),
    "the detail page shows the new price",
  );
  check(
    !edited.body.includes("1,000,000") && !edited.body.includes("10,00,000"),
    "the old price is gone",
  );

  /* ---------------------------------------------------------------------- */
  console.log("\n== Unpublishing: hidden from visitors, kept for the admin ==");
  /* ---------------------------------------------------------------------- */

  await page.locator(`#status-${SLUG}`).waitFor();
  await Promise.all([
    page.waitForURL((url) => url.pathname === "/admin", { timeout: 30000 }),
    createdRow.getByRole("button", { name: "Unpublish" }).click(),
  ]);
  await goto("/admin");

  check(
    await rowFor(SLUG).count() === 1,
    "an unpublished car is STILL listed in the dashboard",
  );
  check(
    await rowFor(SLUG).getByText("Draft", { exact: true }).count() === 1,
    "it is marked as a draft",
  );

  const afterUnpublish = await html("/cars");
  check(
    !afterUnpublish.body.includes(`/cars/${SLUG}`),
    "an unpublished car is gone from /cars",
  );

  /* ---------------------------------------------------------------------- */
  console.log("\n== Publishing again ==");
  /* ---------------------------------------------------------------------- */

  await Promise.all([
    page.waitForURL((url) => url.pathname === "/admin", { timeout: 30000 }),
    rowFor(SLUG).getByRole("button", { name: "Publish" }).click(),
  ]);
  await goto("/admin");
  check(
    await rowFor(SLUG).getByText("Draft", { exact: true }).count() === 0,
    "the draft badge is gone",
  );
  check(
    (await html("/cars")).body.includes(`/cars/${SLUG}`),
    "it is back on /cars",
  );

  /* ---------------------------------------------------------------------- */
  console.log("\n== Marking it sold ==");
  /* ---------------------------------------------------------------------- */

  await Promise.all([
    page.waitForURL((url) => url.pathname === "/admin", { timeout: 30000 }),
    page.locator(`#status-${SLUG}`).selectOption("sold"),
  ]);
  const soldPage = await html(`/cars/${SLUG}`);
  check(soldPage.status === 200, "a sold car's page still resolves", String(soldPage.status));
  check(/sold/i.test(soldPage.body), "the page says the car is sold");

  /* ---------------------------------------------------------------------- */
  console.log("\n== Deleting ==");
  /* ---------------------------------------------------------------------- */

  page.on("dialog", (dialog) => dialog.accept());

  await goto("/admin");
  await Promise.all([
    page.waitForURL((url) => url.pathname === "/admin", { timeout: 30000 }),
    rowFor(SLUG).getByRole("button", { name: `Delete ${SLUG}` }).click(),
  ]);

  const deletedFlash = await page.locator('[role="status"]').innerText();
  check(
    deletedFlash.includes(`Deleted “${SLUG}”`),
    "deleting confirms with the car's address",
    deletedFlash.trim(),
  );
  check(await rowFor(SLUG).count() === 0, "it is gone from the dashboard");
  check(
    !(await html("/cars")).body.includes(`/cars/${SLUG}`),
    "it is gone from /cars",
  );

  const gone = await html(`/cars/${SLUG}`);
  check(gone.status === 404, "its own page now 404s", String(gone.status));

  /* ---------------------------------------------------------------------- */
  console.log("\n== Signing out ==");
  /* ---------------------------------------------------------------------- */

  await Promise.all([
    page.waitForURL((url) => url.pathname === "/admin/login", { timeout: 20000 }),
    page.getByRole("button", { name: /sign out/i }).click(),
  ]);
  check(new URL(page.url()).pathname === "/admin/login", "signing out returns to the sign-in page");

  const afterSignOut = await fetch(base + "/admin", { redirect: "manual" });
  check(
    afterSignOut.status === 307 || afterSignOut.status === 302,
    "the dashboard is locked again",
    `status ${afterSignOut.status}`,
  );
} finally {
  await browser.close();
}

console.log(`\n${checks - failures}/${checks} checks passed.\n`);
process.exit(failures === 0 ? 0 : 1);
