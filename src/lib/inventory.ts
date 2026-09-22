import {
  bodyTypes,
  fuelTypes,
  getBodyTypes,
  getFuelTypes,
  getMakes,
  getModels,
  getPriceBounds,
  getRegistrationCities,
  getStatusCounts,
  getTransmissions,
  getYears,
  priceSteps,
  transmissions,
  vehicles,
} from "@/data/vehicles";
import type { BodyType, FuelType, Transmission, Vehicle } from "@/types/vehicle";

/**
 * ============================================================================
 * Inventory filtering — the single source of truth for the /cars page.
 * ============================================================================
 * Filter state lives entirely in the URL. Nothing is held in React state, so
 * the browser back button works, links are shareable, and the server can
 * render the filtered result without a client round trip.
 *
 * The homepage quick-search panel already emits make, model, minPrice,
 * maxPrice, year and transmission. Those six names are honoured exactly as
 * written so the hand-off between the two pages keeps working.
 */

/** Status is a single choice rather than a set, so there is no ambiguous
 *  "nothing selected" state to explain. */
export type StatusFilter = "available" | "sold" | "all";

export type SortKey =
  | "relevance"
  | "price-asc"
  | "price-desc"
  | "year-desc"
  | "mileage-asc";

export const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "relevance", label: "Recommended" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "year-desc", label: "Newest model year" },
  { value: "mileage-asc", label: "Lowest mileage" },
];

export const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "available", label: "In stock" },
  { value: "sold", label: "Sold" },
  { value: "all", label: "All" },
];

/**
 * Chip wording is deliberately different from the option wording above.
 * A pill names the choice ("All"); a chip has to name the *effect* of removing
 * it, and "Every vehicle ×" reads as though the filter did nothing.
 */
const STATUS_CHIP_LABELS: Record<StatusFilter, string> = {
  available: "In stock only",
  sold: "Sold only",
  all: "Including sold",
};

export interface InventoryFilters {
  q: string;
  make: string;
  model: string;
  minPrice: number | null;
  maxPrice: number | null;
  minYear: number | null;
  maxYear: number | null;
  transmission: Transmission | "";
  fuel: FuelType | "";
  bodyType: BodyType | "";
  city: string;
  status: StatusFilter;
  sort: SortKey;
}

export const defaultFilters: InventoryFilters = {
  q: "",
  make: "",
  model: "",
  minPrice: null,
  maxPrice: null,
  minYear: null,
  maxYear: null,
  transmission: "",
  fuel: "",
  bodyType: "",
  city: "",
  status: "available",
  sort: "relevance",
};

type RawParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

function toInt(value: string): number | null {
  if (!value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.trunc(parsed) : null;
}

/** Only accept values that exist in the current stock, so a stale or
 *  hand-edited URL cannot produce a filter the UI is unable to show. */
function pick<T extends string>(value: string, allowed: readonly T[]): T | "" {
  return (allowed as readonly string[]).includes(value) ? (value as T) : "";
}

/**
 * Turn raw searchParams into a validated filter object.
 * Anything unrecognised is dropped rather than passed through.
 */
export function parseFilters(raw: RawParams): InventoryFilters {
  const makes = getMakes();
  const status = pick(first(raw.status), ["available", "sold", "all"] as const);
  const sort = pick(
    first(raw.sort),
    SORT_OPTIONS.map((option) => option.value),
  );

  const make = pick(first(raw.make), makes);
  // A model is only valid alongside its make — otherwise a stale model name
  // would silently return nothing.
  const model = pick(first(raw.model), make ? getModels(make) : getModels());

  let minPrice = toInt(first(raw.minPrice));
  let maxPrice = toInt(first(raw.maxPrice));
  // A reversed range would always return zero; swap rather than show nothing.
  if (minPrice !== null && maxPrice !== null && minPrice > maxPrice) {
    [minPrice, maxPrice] = [maxPrice, minPrice];
  }

  const years = getYears();
  let minYear = toInt(first(raw.minYear));
  let maxYear = toInt(first(raw.maxYear));
  // The quick-search panel sends a single exact `year`.
  const exactYear = toInt(first(raw.year));
  if (exactYear !== null) {
    minYear = exactYear;
    maxYear = exactYear;
  }
  if (minYear !== null && maxYear !== null && minYear > maxYear) {
    [minYear, maxYear] = [maxYear, minYear];
  }
  if (minYear !== null && !years.includes(minYear)) minYear = null;
  if (maxYear !== null && !years.includes(maxYear)) maxYear = null;

  return {
    q: first(raw.q).trim().slice(0, 60),
    make,
    model,
    minPrice,
    maxPrice,
    minYear,
    maxYear,
    transmission: pick(first(raw.transmission), getTransmissions()),
    fuel: pick(first(raw.fuel), getFuelTypes()),
    bodyType: pick(first(raw.bodyType), getBodyTypes()),
    city: pick(first(raw.city), getRegistrationCities()),
    status: status || defaultFilters.status,
    sort: sort || defaultFilters.sort,
  };
}

/** True when the given vehicle matches every active filter. */
function matches(vehicle: Vehicle, filters: InventoryFilters): boolean {
  if (filters.q) {
    const haystack = [
      vehicle.make,
      vehicle.model,
      vehicle.variant ?? "",
      vehicle.bodyType,
      vehicle.registrationCity,
    ]
      .join(" ")
      .toLowerCase();
    if (!haystack.includes(filters.q.toLowerCase())) return false;
  }

  if (filters.make && vehicle.make !== filters.make) return false;
  if (filters.model && vehicle.model !== filters.model) return false;

  if (filters.minPrice !== null && vehicle.price < filters.minPrice) return false;
  if (filters.maxPrice !== null && vehicle.price > filters.maxPrice) return false;

  if (filters.minYear !== null && vehicle.year < filters.minYear) return false;
  if (filters.maxYear !== null && vehicle.year > filters.maxYear) return false;

  if (filters.transmission && vehicle.transmission !== filters.transmission) {
    return false;
  }
  if (filters.fuel && vehicle.fuel !== filters.fuel) return false;
  if (filters.bodyType && vehicle.bodyType !== filters.bodyType) return false;
  if (filters.city && vehicle.registrationCity !== filters.city) return false;

  // "available" means buyable stock — reserved cars are still shown, because
  // a reserved car can fall through and the enquiry is still worth having.
  if (filters.status === "available" && vehicle.status === "sold") return false;
  if (filters.status === "sold" && vehicle.status !== "sold") return false;

  return true;
}

const STATUS_RANK: Record<Vehicle["status"], number> = {
  available: 0,
  reserved: 1,
  sold: 2,
};

export function sortVehicles(list: Vehicle[], sort: SortKey): Vehicle[] {
  const sorted = [...list];

  switch (sort) {
    case "price-asc":
      return sorted.sort((a, b) => a.price - b.price);
    case "price-desc":
      return sorted.sort((a, b) => b.price - a.price);
    case "year-desc":
      return sorted.sort((a, b) => b.year - a.year);
    case "mileage-asc":
      return sorted.sort((a, b) => a.mileage - b.mileage);
    case "relevance":
    default:
      // Buyable stock first, then promoted listings, then newest.
      return sorted.sort((a, b) => {
        if (STATUS_RANK[a.status] !== STATUS_RANK[b.status]) {
          return STATUS_RANK[a.status] - STATUS_RANK[b.status];
        }
        if (Boolean(b.featured) !== Boolean(a.featured)) {
          return Number(Boolean(b.featured)) - Number(Boolean(a.featured));
        }
        return b.year - a.year;
      });
  }
}

export function selectVehicles(filters: InventoryFilters): Vehicle[] {
  return sortVehicles(
    vehicles.filter((vehicle) => matches(vehicle, filters)),
    filters.sort,
  );
}

/* ==========================================================================
   Serialisation
   ========================================================================== */

/** Chip keys double as "clear this group" handles, so the price and year
 *  ranges each clear as one chip rather than two. */
export type ChipKey =
  | "q"
  | "make"
  | "model"
  | "price"
  | "year"
  | "transmission"
  | "fuel"
  | "bodyType"
  | "city"
  | "status";

export function toQueryString(
  filters: InventoryFilters,
  omit?: ChipKey,
): string {
  const params = new URLSearchParams();

  const keep = (key: ChipKey) => omit !== key;

  if (filters.q && keep("q")) params.set("q", filters.q);
  if (filters.make && keep("make")) params.set("make", filters.make);
  if (filters.model && keep("model")) params.set("model", filters.model);

  if (keep("price")) {
    if (filters.minPrice !== null) params.set("minPrice", String(filters.minPrice));
    if (filters.maxPrice !== null) params.set("maxPrice", String(filters.maxPrice));
  }

  if (keep("year")) {
    if (filters.minYear !== null) params.set("minYear", String(filters.minYear));
    if (filters.maxYear !== null) params.set("maxYear", String(filters.maxYear));
  }

  if (filters.transmission && keep("transmission")) {
    params.set("transmission", filters.transmission);
  }
  if (filters.fuel && keep("fuel")) params.set("fuel", filters.fuel);
  if (filters.bodyType && keep("bodyType")) params.set("bodyType", filters.bodyType);
  if (filters.city && keep("city")) params.set("city", filters.city);

  // Only write a non-default status, so the default URL stays clean.
  if (filters.status !== defaultFilters.status && keep("status")) {
    params.set("status", filters.status);
  }
  if (filters.sort !== defaultFilters.sort) params.set("sort", filters.sort);

  return params.toString();
}

export function hrefFor(filters: InventoryFilters, omit?: ChipKey): string {
  const query = toQueryString(filters, omit);
  return query ? `/cars?${query}` : "/cars";
}

export interface ActiveChip {
  key: ChipKey;
  label: string;
  /** Ready-made href that clears just this group. */
  clearHref: string;
}

const money = new Intl.NumberFormat("en-US");

/** Human-readable summary of each active filter, for the chip row. */
export function activeChips(filters: InventoryFilters): ActiveChip[] {
  const chips: ActiveChip[] = [];
  const push = (key: ChipKey, label: string) =>
    chips.push({ key, label, clearHref: hrefFor(filters, key) });

  if (filters.q) push("q", `“${filters.q}”`);
  if (filters.make) push("make", filters.make);
  if (filters.model) push("model", filters.model);

  if (filters.minPrice !== null || filters.maxPrice !== null) {
    const low = filters.minPrice !== null ? `PKR ${money.format(filters.minPrice)}` : "Any";
    const high = filters.maxPrice !== null ? `PKR ${money.format(filters.maxPrice)}` : "Any";
    push("price", `${low} – ${high}`);
  }

  if (filters.minYear !== null || filters.maxYear !== null) {
    if (filters.minYear !== null && filters.minYear === filters.maxYear) {
      push("year", String(filters.minYear));
    } else {
      push(
        "year",
        `${filters.minYear ?? "Any"} – ${filters.maxYear ?? "Any"}`,
      );
    }
  }

  if (filters.transmission) push("transmission", filters.transmission);
  if (filters.fuel) push("fuel", filters.fuel);
  if (filters.bodyType) push("bodyType", filters.bodyType);
  if (filters.city) push("city", `Registered in ${filters.city}`);
  if (filters.status !== defaultFilters.status) {
    push("status", STATUS_CHIP_LABELS[filters.status]);
  }

  return chips;
}

/** How many filter groups are set — used to badge the mobile filter button. */
export function countActiveFilters(filters: InventoryFilters): number {
  return activeChips(filters).length;
}

/* Re-exported so the UI has one import site for filter option lists. */
export {
  bodyTypes,
  fuelTypes,
  getBodyTypes,
  getFuelTypes,
  getMakes,
  getModels,
  getPriceBounds,
  getRegistrationCities,
  getStatusCounts,
  getTransmissions,
  getYears,
  priceSteps,
  transmissions,
};
