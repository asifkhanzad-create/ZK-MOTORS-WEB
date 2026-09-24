import type { VehicleRow } from "@/types/database";
import type { AdminVehicle, Vehicle } from "@/types/vehicle";

/**
 * The database row → domain object boundary.
 *
 * This is the only place that knows the two shapes differ. Postgres uses
 * snake_case (`body_type`, `registration_city`) and returns `null` for absent
 * values; the app's `Vehicle` uses camelCase and `undefined`. Every other module
 * works in `Vehicle` and never sees a row.
 *
 * Kept deliberately free of runtime imports — both imports above are
 * type-only, so they are erased at build time and this module has no
 * dependencies at all. That is what lets `qa/unit-vehicle-mapper.mjs` import it
 * directly under Node's type stripping and test the mapping without a database,
 * which is the part most likely to be quietly wrong.
 *
 * The column list it reads is checked against the migration by
 * `scripts/verify_schema.py`, so a renamed column fails there rather than
 * silently producing `undefined` here.
 */

/** `null` → `undefined`, so optional fields stay absent rather than nullish. */
const optional = (value: string | null): string | undefined => value ?? undefined;

export function toVehicle(row: VehicleRow): Vehicle {
  return {
    id: row.id,
    make: row.make,
    model: row.model,
    variant: optional(row.variant),
    year: row.year,
    price: row.price,
    mileage: row.mileage,
    transmission: row.transmission,
    fuel: row.fuel,
    bodyType: row.body_type,
    registrationCity: row.registration_city,
    status: row.status,
    image: row.image,
    imageAlt: row.image_alt,
    highlight: optional(row.highlight),
    description: optional(row.description),
    /* An empty array becomes `undefined` rather than `[]`. The domain type says
       `gallery?: string[]`, and every consumer asks `gallery?.length` — an empty
       array and an absent one mean the same thing to them, so collapsing the two
       removes a case the UI would otherwise have to handle twice. */
    gallery: row.gallery.length > 0 ? row.gallery : undefined,
    featured: row.featured,
  };
  /* Deliberately dropped: `published` (an RLS concern — if a row reached here it
     is published), and `created_at` / `updated_at` (bookkeeping the UI never
     shows). They stay on the row type because inserts and admin views need
     them; they just are not part of what a visitor sees. */
}

export function toVehicleList(rows: VehicleRow[]): Vehicle[] {
  return rows.map(toVehicle);
}

/**
 * The same mapping, plus the three columns `toVehicle` throws away.
 *
 * Built on top of `toVehicle` rather than repeating the field list, so the two
 * can only ever differ by these three keys. If a column is added to `Vehicle`,
 * it lands in both at once.
 */
export function toAdminVehicle(row: VehicleRow): AdminVehicle {
  return {
    ...toVehicle(row),
    published: row.published,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toAdminVehicleList(rows: VehicleRow[]): AdminVehicle[] {
  return rows.map(toAdminVehicle);
}
