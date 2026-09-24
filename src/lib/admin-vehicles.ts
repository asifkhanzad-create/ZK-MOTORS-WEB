import { createSupabaseServerClient } from "@/lib/supabase-server";
import { toAdminVehicle, toAdminVehicleList } from "@/lib/vehicle-mapper";
import type { AdminVehicle } from "@/types/vehicle";

/**
 * Reads for the stock dashboard.
 *
 * Separate from `vehicles-source.ts` for one reason: **these queries are not
 * filtered by `published`.** The public list deliberately asks only for
 * published rows, so a draft can never leak into a visitor-facing page; the
 * admin has to see drafts, because a car that cannot be seen cannot be
 * published. Two different questions, so two different queries — rather than one
 * query with a flag, where the flag is the only thing standing between a draft
 * and the public site.
 *
 * They also run on the cookie-backed client from `supabase-server.ts`, so the
 * request is made as the signed-in admin and row-level security decides what
 * comes back.
 *
 * ## These need a policy that `0001_vehicles.sql` does not have
 *
 * The select policy there is `using (published = true)` with **no `to` clause**,
 * so it applies to every role — including `authenticated`. Policies are
 * permissive and OR'd, and there is no second select policy for admins, so as
 * things stand a signed-in admin can still only read published rows. Writes are
 * already granted; reads of drafts are not.
 *
 * `supabase/migrations/0002_admin_access.sql` adds the missing select policy.
 * Until it has been run, the dashboard will list only the published cars and
 * editing a draft will fail with a row-not-found.
 */

export async function fetchAdminVehicles(): Promise<AdminVehicle[]> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("vehicles")
    /* `*` rather than a column list: the mapper is the single place that knows
       which columns exist, and a list here would be a second one to keep in
       step. */
    .select("*")
    .order("id", { ascending: true });

  if (error) {
    throw new Error(`Could not load stock for the dashboard: ${error.message}`);
  }

  return toAdminVehicleList(data);
}

/**
 * One listing, draft or not.
 *
 * `maybeSingle()` rather than `single()`: "no such car" is an ordinary outcome
 * for a stale link or a deleted row, and it should render a 404, not throw.
 */
export async function fetchAdminVehicle(id: string): Promise<AdminVehicle | null> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("vehicles")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(`Could not load "${id}" for the dashboard: ${error.message}`);
  }

  return data ? toAdminVehicle(data) : null;
}
