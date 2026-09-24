import type { BodyType, FuelType, Transmission, Vehicle, VehicleStatus } from "@/types/vehicle";

/**
 * ============================================================================
 * Stock-derived option lists and selectors.
 * ============================================================================
 * These power the filter sidebar, the homepage quick-search and the vehicle
 * detail page. They were previously module-level functions in
 * `src/data/vehicles.ts` that closed over a hard-coded array.
 *
 * They are pure functions of a list now, because the list comes from Supabase
 * and reading it is asynchronous. That is the whole reason this module exists:
 * a component cannot call `getMakes()` any more, because there is no longer a
 * single array to derive it from. The server fetches once per request and
 * passes the list down.
 *
 * The functions are also *pure*, which is worth stating plainly: given the same
 * list they return the same answer, they touch no network and no module state.
 * That keeps them trivially testable, and it means the three client components
 * that need them can receive a plain array rather than each doing their own
 * fetch.
 *
 * ## Why the option lists are derived from stock at all
 *
 * The `get*` helpers return what is *actually in stock*, not the union of the
 * domain types. That way the filter UI can never offer a facet guaranteed to
 * return zero results — add a hybrid to the table and "Hybrid" appears in the
 * filters on its own.
 *
 * The domain constants below (`transmissions`, `fuelTypes`, `bodyTypes`) are
 * the opposite: fixed lists, defined here rather than derived. They are the
 * full set the business accepts, which is what a form needs — see the note on
 * the sell form's dropdowns.
 */

/* ==========================================================================
   Domain constants — the full set, not what happens to be in stock
   ========================================================================== */

/** Domain order is defined here; the getters below return only what is in stock. */
export const transmissions: Transmission[] = ["Automatic", "Manual"];

export const fuelTypes: FuelType[] = ["Petrol", "Diesel", "Hybrid", "Electric"];

export const bodyTypes: BodyType[] = [
  "Sedan",
  "Hatchback",
  "SUV",
  "Crossover",
  "Pickup",
];

/**
 * Round price steps for the min/max selects. Kept as a fixed ladder rather than
 * derived from stock so the choices stay stable as inventory changes.
 */
export const priceSteps = [
  2_000_000, 3_000_000, 4_000_000, 5_000_000, 6_000_000, 8_000_000,
  10_000_000, 15_000_000, 20_000_000, 30_000_000,
];

/* ==========================================================================
   Selectors
   ========================================================================== */

/** Vehicles shown in the homepage "Featured cars" grid. */
export function getFeaturedVehicles(list: readonly Vehicle[]): Vehicle[] {
  return list.filter((v) => v.featured && v.status !== "sold");
}

/** Vehicles shown in the "Recently sold" strip. */
export function getRecentlySoldVehicles(
  list: readonly Vehicle[],
  limit = 4,
): Vehicle[] {
  return list.filter((v) => v.status === "sold").slice(0, limit);
}

/** Single vehicle for a detail route. Returns undefined for an unknown slug. */
export function getVehicleById(
  list: readonly Vehicle[],
  id: string,
): Vehicle | undefined {
  return list.find((vehicle) => vehicle.id === id);
}

/**
 * Other cars a buyer looking at `vehicle` would plausibly also want to see.
 *
 * Scored rather than filtered, because a hard filter ("same body type AND
 * within 20% on price") collapses to nothing for the less common cars — the
 * Hilux pickup and the BMW have no close match at all. Scoring always returns
 * `limit` results, and the strongest matches float to the top.
 *
 * Sold cars are never suggested: sending someone to a car they cannot buy is
 * the fastest way to lose the enquiry.
 */
export function getSimilarVehicles(
  list: readonly Vehicle[],
  vehicle: Vehicle,
  limit = 3,
): Vehicle[] {
  const pool = list.filter(
    (candidate) => candidate.id !== vehicle.id && candidate.status !== "sold",
  );

  return pool
    .map((candidate) => {
      let score = 0;
      if (candidate.bodyType === vehicle.bodyType) score += 3;
      if (candidate.make === vehicle.make) score += 2;
      if (candidate.fuel === vehicle.fuel) score += 1;
      if (candidate.transmission === vehicle.transmission) score += 1;

      /* Price proximity is relative, so a cheap car is compared against other
         cheap cars rather than against something three times the money. */
      const priceGap = Math.abs(candidate.price - vehicle.price) / vehicle.price;
      if (priceGap <= 0.25) score += 2;
      else if (priceGap <= 0.6) score += 1;

      return { candidate, score, priceGap };
    })
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (a.priceGap !== b.priceGap) return a.priceGap - b.priceGap;
      return b.candidate.year - a.candidate.year;
    })
    .slice(0, limit)
    .map((entry) => entry.candidate);
}

/* ==========================================================================
   Filter option lists
   ========================================================================== */

export function getMakes(list: readonly Vehicle[]): string[] {
  return [...new Set(list.map((v) => v.make))].sort();
}

/** Models for a given make; returns all models when no make is selected. */
export function getModels(list: readonly Vehicle[], make?: string): string[] {
  const pool = make ? list.filter((v) => v.make === make) : list;
  return [...new Set(pool.map((v) => v.model))].sort();
}

export function getYears(list: readonly Vehicle[]): number[] {
  return [...new Set(list.map((v) => v.year))].sort((a, b) => b - a);
}

export function getRegistrationCities(list: readonly Vehicle[]): string[] {
  return [...new Set(list.map((v) => v.registrationCity))].sort();
}

export function getTransmissions(list: readonly Vehicle[]): Transmission[] {
  const present = new Set(list.map((v) => v.transmission));
  return transmissions.filter((item) => present.has(item));
}

export function getFuelTypes(list: readonly Vehicle[]): FuelType[] {
  const present = new Set(list.map((v) => v.fuel));
  return fuelTypes.filter((item) => present.has(item));
}

export function getBodyTypes(list: readonly Vehicle[]): BodyType[] {
  const present = new Set(list.map((v) => v.bodyType));
  return bodyTypes.filter((item) => present.has(item));
}

/**
 * Price bounds derived from stock, rounded to sensible steps for the UI.
 *
 * Returns `null` for an empty list rather than `{ min: 0, max: 0 }`. With no
 * stock the caller has no information to bound the ladder with, and a literal
 * zero would read as "prices start at nothing" — the caller needs to be able to
 * tell the two apart to decide what to show.
 *
 * This is not hypothetical pedantry: `Math.min(...[])` is `Infinity`, so the
 * naive version of this function returned an infinite maximum, which the
 * min-price ladder then filtered down to an empty list of options.
 */
export function getPriceBounds(
  list: readonly Vehicle[],
): { min: number; max: number } | null {
  if (list.length === 0) return null;

  const prices = list.map((v) => v.price);
  return {
    min: Math.floor(Math.min(...prices) / 100_000) * 100_000,
    max: Math.ceil(Math.max(...prices) / 100_000) * 100_000,
  };
}

/** How many vehicles sit in each status — used for the filter option counts. */
export function getStatusCounts(
  list: readonly Vehicle[],
): Record<VehicleStatus, number> {
  return list.reduce(
    (acc, vehicle) => {
      acc[vehicle.status] += 1;
      return acc;
    },
    { available: 0, reserved: 0, sold: 0 } as Record<VehicleStatus, number>,
  );
}
