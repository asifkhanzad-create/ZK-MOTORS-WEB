/**
 * Verify that what is in Supabase is what the source data says.
 *
 *     node --env-file=.env.local --experimental-strip-types qa/verify-seed.mjs
 *
 * Why this matters more than a row count: a seed can "succeed" while being
 * wrong. A dropped record, a truncated description, a `null` where the source
 * has a value, or a number that lost its precision would all report
 * "Success. No rows returned" in the SQL editor and then quietly render a
 * slightly different site. This compares field by field.
 *
 * It also proves the round trip end to end for the first time: the rows are
 * read over the network, mapped by the real `toVehicle()` used in production,
 * and compared against `src/data/vehicles.ts`. Both modules have only type
 * imports, which is what lets Node load them directly with no database
 * harness and no path-alias resolution.
 */

import { createClient } from "@supabase/supabase-js";

import { vehicles as local } from "../src/data/vehicles.ts";
import { toVehicle } from "../src/lib/vehicle-mapper.ts";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY.");
  console.error("Run with: node --env-file=.env.local --experimental-strip-types qa/verify-seed.mjs");
  process.exit(2);
}

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { data: rows, error } = await supabase.from("vehicles").select("*").order("id");

if (error) {
  console.error(`Query failed: ${error.message}`);
  process.exit(2);
}

let failures = 0;
const fail = (label, detail) => {
  console.log(`  FAIL  ${label}  (${detail})`);
  failures++;
};
const pass = (label, detail = "") => console.log(`  PASS  ${label}${detail ? `  (${detail})` : ""}`);

console.log(`\n== Row count ==`);
pass(
  `${rows.length} rows in Supabase vs ${local.length} in the source`,
  rows.length === local.length ? "match" : "MISMATCH",
);
if (rows.length !== local.length) failures++;

console.log(`\n== Every source vehicle is present and identical ==`);
const byId = new Map(rows.map((r) => [r.id, r]));

/** Fields worth comparing, and how to describe them when they differ. */
const FIELDS = [
  "make",
  "model",
  "variant",
  "year",
  "price",
  "mileage",
  "transmission",
  "fuel",
  "bodyType",
  "registrationCity",
  "status",
  "image",
  "imageAlt",
  "highlight",
  "description",
  "featured",
];

for (const source of local) {
  const row = byId.get(source.id);
  if (!row) {
    fail(source.id, "missing from Supabase");
    continue;
  }

  /* Mapped by the production mapper, so this also tests it against real rows
     rather than the fixtures in qa/unit-vehicle-mapper.mjs. */
  const mapped = toVehicle(row);

  const diffs = [];
  for (const field of FIELDS) {
    const a = source[field];
    const b = mapped[field];
    /* Normalise before comparing, per field.
     *
     * Optional fields: `undefined` and absent mean the same thing, so both
     * collapse to null. Without this, every `highlight: null` in the database
     * would read as a difference from an omitted key in the source.
     *
     * `featured` is the special case, and it caught this check out on its first
     * run: the source omits the key entirely for a non-featured car, while the
     * column is `not null default false`, so the database stores `false`. Those
     * are the same fact — `vehicle.featured` is falsy either way and
     * `getFeaturedVehicles()` cannot tell them apart. Comparing them raw
     * reported 8 false failures, which is a bug in the check rather than in the
     * seed. Normalising `undefined | null | false` to `false` is correct. */
    const norm = (v) => (field === "featured" ? v === true : v === undefined ? null : v);
    if (norm(a) !== norm(b)) {
      diffs.push(`${field}: source=${JSON.stringify(a)?.slice(0, 60)} db=${JSON.stringify(b)?.slice(0, 60)}`);
    }
  }

  const srcGallery = source.gallery?.length ? source.gallery : undefined;
  if (JSON.stringify(srcGallery) !== JSON.stringify(mapped.gallery)) {
    diffs.push(`gallery: source=${JSON.stringify(srcGallery)} db=${JSON.stringify(mapped.gallery)}`);
  }

  if (diffs.length) fail(source.id, diffs.join(" | "));
  else pass(source.id);
}

console.log(`\n== Descriptions arrived intact ==`);
const withDesc = local.filter((v) => v.description);
const truncated = withDesc.filter((v) => {
  const row = byId.get(v.id);
  return !row || row.description !== v.description;
});
pass(
  `${withDesc.length} descriptions compared character for character`,
  truncated.length ? `${truncated.length} differ` : "all identical",
);
if (truncated.length) failures++;

console.log(
  `\n${failures === 0 ? "Seed is faithful to the source data." : `${failures} problem(s) found.`}\n`,
);
process.exit(failures === 0 ? 0 : 1);
