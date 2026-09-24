import { cache } from "react";

import { getSupabase } from "@/lib/supabase";
import { toVehicleList } from "@/lib/vehicle-mapper";
import type { Vehicle } from "@/types/vehicle";

/**
 * Reads stock from Supabase.
 *
 * This is the only module that talks to the database. It returns domain
 * `Vehicle` objects, never rows — the translation happens in
 * `src/lib/vehicle-mapper.ts`, which is unit-tested without a database.
 *
 * ## Wrapped in `cache()` on purpose
 *
 * A single detail-page render asks for the inventory more than once:
 * `generateMetadata` needs the car, and the page body needs the car *and* the
 * whole list to score similar vehicles against. Without memoisation that is
 * three round trips to render one page. React's `cache()` collapses them to one
 * per request, and does so without a module-level cache that would leak stale
 * stock between requests.
 *
 * There is deliberately no `fetchVehicleById`. The detail page needs the whole
 * list regardless — similar vehicles are scored against it — so a targeted
 * single-row query would be a *second* round trip to save nothing. Add one back
 * if a caller ever needs a single car without the pool.
 *
 * ## Filtering is not done here
 *
 * These functions fetch; they do not filter. The filter engine lives in
 * `src/lib/inventory.ts` (`matches()`, `sortVehicles()`) and is applied to the
 * returned list.
 *
 * That is a deliberate choice, not a shortcut. Reimplementing `matches()` as SQL
 * `where` clauses would create two definitions of "matches" that can drift
 * silently — and at dealership scale (hundreds of rows) pushing the work into
 * Postgres buys nothing. Revisit only if stock reaches the thousands, and if it
 * does, keep `matches()` as the reference implementation to test the SQL against.
 *
 * ## Failure is loud
 *
 * Both functions throw rather than returning an empty list. An empty inventory
 * and a failed query look identical to a visitor, and "we have no cars" is a
 * worse failure for a dealership than a visible error. Callers that can present
 * a better message catch it — see `/cars`.
 *
 * ## Verification status
 *
 * Verified against the live project on 2026-09-24: `qa/probe-supabase.mjs`
 * reads all 14 rows anonymously and `qa/verify-seed.mjs` maps them through the
 * production `toVehicle()` and compares every field to `src/data/vehicles.ts`.
 */

export const fetchVehicles = cache(async (): Promise<Vehicle[]> => {
  const { data, error } = await getSupabase()
    .from("vehicles")
    .select("*")
    /* `published` is also enforced by the read policy in the migration. Asking
       for it again here is defence in depth: if someone ever drops the policy by
       accident, the app still will not show drafts. The RLS behaviour itself is
       tested separately, by qa/probe-supabase.mjs — so this filter cannot mask a
       broken policy the way it could if it were the only check. */
    .eq("published", true)
    /* Deterministic order. `sortVehicles()` re-sorts by the visitor's chosen
       key, so this only decides ties — but it decides them the same way on every
       request, which a dealership's grid of identical-year cars needs. */
    .order("id", { ascending: true });

  if (error) {
    throw new Error(`Could not load inventory from Supabase: ${error.message}`);
  }

  return toVehicleList(data);
});
