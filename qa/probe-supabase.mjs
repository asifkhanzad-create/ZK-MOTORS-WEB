/**
 * Probe the live Supabase project.
 *
 *     node --env-file=.env.local qa/probe-supabase.mjs
 *
 * Checks the things that have to be true before the data layer can be switched
 * over, and that no amount of typechecking can confirm:
 *
 *   1. the URL and publishable key are accepted
 *   2. the `vehicles` table is reachable
 *   3. row-level security is filtering reads (not erroring, and not leaking drafts)
 *   4. the `vehicle-photos` bucket exists and is publicly readable
 *   5. every photo the site will ask for is actually in Storage
 *
 * ## A note on how Storage is checked
 *
 * This probe used to call `storage.getBucket()`, which is an **admin** API. The
 * publishable key cannot use it, so it returned an error *whether or not the
 * bucket existed* — and the probe confidently reported a missing bucket that was
 * actually there. A false negative is worse than no check: it sends someone off
 * to fix a thing that is already correct.
 *
 * The reliable anonymous test is to request a public object and read the error
 * *code*. Supabase distinguishes the two failures:
 *
 *   NoSuchBucket  the bucket itself is missing
 *   NoSuchKey     the bucket exists, that object does not
 *
 * The control assertion pins that distinction, so if Supabase ever changes the
 * codes this probe fails loudly instead of quietly reporting everything present.
 *
 * ## Why there are two bucket-level checks, not one
 *
 * Supabase's error-code docs warn that *both* codes are also returned when you
 * lack permission — NoSuchBucket when the bucket "exists [but] you don't have
 * permissions to access it". So a **private** bucket answers NoSuchBucket, and
 * "the bucket is missing" and "the bucket is private" are indistinguishable from
 * the outside.
 *
 * They are distinguishable by asking a different question: request an object
 * that certainly does not exist. If the reply is NoSuchKey, the bucket lookup
 * itself succeeded and the bucket is public. If it is NoSuchBucket, the bucket
 * is missing or private.
 *
 * That extra request earns its place. A private bucket accepts the upload and
 * then serves nothing, so it presents as a failed upload — and the fix (flip one
 * toggle) is nothing like the fix for a failed upload (retry it).
 */

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const BUCKET = "vehicle-photos";

let failures = 0;
let checks = 0;
const check = (ok, label, detail = "") => {
  checks++;
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}${detail ? `  (${detail})` : ""}`);
  if (!ok) failures++;
};

console.log("\n== Configuration ==");
check(!!url, "NEXT_PUBLIC_SUPABASE_URL is set", url ?? "missing");
check(!!key, "NEXT_PUBLIC_SUPABASE_ANON_KEY is set", key ? `${key.slice(0, 18)}…` : "missing");

if (!url || !key) {
  console.log("\nCannot continue without both values. See .env.example.\n");
  process.exit(1);
}

/* --------------------------------------------------------------------------
   Auth configuration — read from the project's own public settings endpoint
   --------------------------------------------------------------------------
   `/auth/v1/settings` reports the flags the Auth server is actually running
   with, which is a stronger statement than "someone ticked the box": it is what
   the signup and token endpoints consult.

   `disable_signup` is the one that matters. Every write policy in
   `supabase/migrations/0001_vehicles.sql` and `0002_admin_access.sql` is
   `to authenticated`, so any account at all can edit, publish and delete stock.
   While sign-ups are open, anyone who knows the project URL — which ships to
   every visitor's browser — can register, confirm their own address, and start
   editing listings. The dashboard's own sign-in page is no protection: it is a
   UI, and the policies are the control.

   `mailer_autoconfirm` is reported rather than asserted. It is false on hosted
   projects by default, and false is the safer setting: a self-registered
   account cannot sign in until it confirms an address it controls. That is a
   speed bump, not a lock — which is exactly why `disable_signup` is asserted.
   -------------------------------------------------------------------------- */

console.log("\n== Auth configuration ==");

const settingsResponse = await fetch(`${url}/auth/v1/settings`, { headers: { apikey: key } });
const settings = settingsResponse.ok ? await settingsResponse.json() : null;

check(
  settingsResponse.ok,
  "/auth/v1/settings is reachable",
  `HTTP ${settingsResponse.status}`,
);

if (settings) {
  check(
    settings.disable_signup === true,
    "public sign-ups are disabled",
    settings.disable_signup === true
      ? "disable_signup = true"
      : "disable_signup = false — turn it off in Authentication → Sign In / Providers",
  );
  console.log(
    `        mailer_autoconfirm = ${settings.mailer_autoconfirm}` +
      `  ·  email provider = ${settings.external?.email}` +
      `  ·  anonymous = ${settings.external?.anonymous_users}`,
  );
}

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

/** Public object request. Returns { status, code } — `code` is the useful part. */
async function probeObject(bucket, name) {
  const res = await fetch(`${url}/storage/v1/object/public/${bucket}/${encodeURIComponent(name)}`);
  if (res.ok) return { status: res.status, code: null };
  let code = null;
  try {
    code = (await res.json())?.code ?? null;
  } catch {
    /* Non-JSON body; leave code null and let the caller report the status. */
  }
  return { status: res.status, code };
}

console.log("\n== Table reachable ==");
const { data, error, status } = await supabase
  .from("vehicles")
  .select("id, make, model, year, status, published, image")
  .order("id");

check(!error, "select on vehicles succeeds", error ? `${error.code}: ${error.message}` : `HTTP ${status}`);
check(Array.isArray(data), "the response is an array", `got ${Array.isArray(data) ? "array" : typeof data}`);

const rows = data ?? [];
console.log(`\n  ${rows.length} published row(s) visible to an anonymous reader.`);

if (rows.length) {
  console.log("\n  first three:");
  for (const r of rows.slice(0, 3)) {
    console.log(`    ${r.id.padEnd(40)} ${r.year}  ${r.status.padEnd(10)} published=${r.published}`);
  }
}

console.log("\n== RLS is filtering, not erroring ==");
if (rows.length === 0) {
  /* Without this warning the two checks below pass on an empty table and read
     as "RLS verified" when nothing was actually tested. An assertion that
     cannot fail is not evidence. */
  console.log("  WARN  the table is empty, so the RLS checks below are VACUOUS.");
  console.log("        Seed some rows and re-run before trusting them.");
}
check(rows.every((r) => r.published === true), "every visible row has published = true");

const { data: drafts } = await supabase.from("vehicles").select("id").eq("published", false);
check(
  (drafts ?? []).length === 0,
  "unpublished rows are not visible to an anonymous reader",
  `${(drafts ?? []).length} leaked`,
);

console.log("\n== Storage ==");
/* Control first: a bucket name that cannot exist must report NoSuchBucket. If it
   does not, the codes have changed and the per-photo results below are
   meaningless. */
const control = await probeObject("no-such-bucket-control-xyz", "a.jpg");
check(
  control.code === "NoSuchBucket",
  "control: a missing bucket reports NoSuchBucket",
  `got ${control.code ?? `HTTP ${control.status}`}`,
);

/* Then: does the real bucket exist *and* serve the public? Ask for an object
   that cannot possibly exist.

   Supabase's error-code docs say both codes are also returned when you lack
   permission: NoSuchBucket if the bucket "exists [but] you don't have
   permissions to access it", NoSuchKey likewise for a key. So a **private**
   bucket answers NoSuchBucket at the bucket level, and only a bucket the public
   endpoint can actually see answers NoSuchKey.

   This distinction is worth the extra request. A private bucket accepts the
   upload happily and then serves nothing, so it presents as a failed upload —
   and the fix (flip one toggle) is nothing like the fix for a failed upload
   (retry it). */
const sentinel = await probeObject(BUCKET, "this-object-cannot-exist-8f3a.jpg");
const bucketPublic = control.code === "NoSuchBucket" && sentinel.code === "NoSuchKey";

if (control.code === "NoSuchBucket") {
  check(
    bucketPublic,
    `the ${BUCKET} bucket exists and is publicly readable`,
    sentinel.code === "NoSuchKey" ? "confirmed" : `got ${sentinel.code ?? `HTTP ${sentinel.status}`}`,
  );
  if (!bucketPublic) {
    console.log("        NoSuchBucket here means the bucket is either missing or not");
    console.log(`        marked Public. Check Storage -> ${BUCKET} -> Settings.`);
    console.log("        A private bucket accepts uploads and then serves nothing.");
  }
}

if (control.code !== "NoSuchBucket") {
  console.log("  SKIP  photo checks — the control failed, so absence cannot be distinguished.");
} else if (!bucketPublic) {
  console.log("  SKIP  photo checks — fix the bucket first, then re-run.");
} else if (rows.length === 0) {
  console.log("  SKIP  no rows, so there are no image paths to check.");
} else {
  /* Check the exact filename each row will request, derived from the row rather
     than a hard-coded list — so this stays correct when stock changes. */
  const names = [...new Set(rows.map((r) => String(r.image).split("/").pop()))];
  const missing = [];
  for (const name of names) {
    const res = await probeObject(BUCKET, name);
    if (!(res.status === 200 || res.status === 304)) missing.push(name);
  }

  if (missing.length === 0) {
    check(true, `all ${names.length} photos are in the ${BUCKET} bucket`);
  } else if (missing.length === names.length) {
    check(false, `photos are in the ${BUCKET} bucket`, `all ${names.length} missing`);
    console.log("        Upload them in the dashboard: Storage -> vehicle-photos -> Upload files.");
    console.log("        The 14 files are staged in storage-upload/ at the project root.");
  } else {
    check(false, `photos are in the ${BUCKET} bucket`, `${missing.length} of ${names.length} missing`);
    console.log(`        missing: ${missing.join(", ")}`);
  }

  /* Does the database actually *reference* Storage, or only a local path that
     happens to share the filename?

     This check was previously a hard-coded `check(true, …)`, which is not a
     check at all — it reported "image paths point at Storage" while every row
     still held `/vehicles/….jpg`. The photo checks above cannot catch that,
     because they derive the filename from the row and so pass either way. A
     site reading `/vehicles/bmw-x3.jpg` works locally and 404s on Vercel, which
     is precisely the failure this is supposed to prevent. */
  const prefix = `${url}/storage/v1/object/public/${BUCKET}/`;
  const local = rows.filter((r) => !String(r.image).startsWith(prefix));
  check(
    local.length === 0,
    "every row's image column is a Storage URL, not a local path",
    local.length === 0 ? `all ${rows.length} point at ${BUCKET}` : `${local.length} still local`,
  );
  if (local.length) {
    console.log("        Still local: " + local.map((r) => r.id).join(", "));
    console.log("        Run supabase/seed-storage.sql to repoint them.");
  }
}

console.log(`\n${checks - failures}/${checks} checks passed.\n`);
process.exit(failures === 0 ? 0 : 1);
