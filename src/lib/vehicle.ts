import { formatMileage, vehicleTitle } from "@/lib/format";
import type { Vehicle } from "@/types/vehicle";

/**
 * Data shaping for the vehicle detail page.
 *
 * Everything here reads from the record and nothing is inferred. The spec
 * table in particular must stay a faithful rendering of what is known about
 * the car — a detail page is where an invented "full service history" or
 * "one owner" line would do the most damage.
 */

export interface SpecRow {
  label: string;
  value: string;
}

/** e.g. "2021 Toyota Corolla Altis Grande 1.8" */
export function vehicleFullTitle(vehicle: Vehicle): string {
  return `${vehicle.year} ${vehicleTitle(vehicle)}`;
}

/** Rows for the detail-page spec table. */
export function vehicleSpecs(vehicle: Vehicle): SpecRow[] {
  const rows: SpecRow[] = [
    { label: "Make", value: vehicle.make },
    { label: "Model", value: vehicle.model },
  ];

  /* Variant is optional in the data, so an empty row would be worse than no
     row — a blank "Variant —" reads like missing information. */
  if (vehicle.variant) {
    rows.push({ label: "Variant", value: vehicle.variant });
  }

  rows.push(
    { label: "Model year", value: String(vehicle.year) },
    { label: "Mileage", value: formatMileage(vehicle.mileage) },
    { label: "Transmission", value: vehicle.transmission },
    { label: "Fuel", value: vehicle.fuel },
    { label: "Body type", value: vehicle.bodyType },
    { label: "Registered in", value: vehicle.registrationCity },
  );

  return rows;
}

/**
 * Copy for a listing with no hand-written description. States only what the
 * record already says, so it can never claim more than the data supports.
 */
export function vehicleFallbackDescription(vehicle: Vehicle): string {
  return [
    `${vehicleFullTitle(vehicle)}.`,
    `${formatMileage(vehicle.mileage)} covered.`,
    `${vehicle.transmission}, ${vehicle.fuel.toLowerCase()}, registered in ${vehicle.registrationCity}.`,
  ].join(" ");
}

export function vehicleDescription(vehicle: Vehicle): string {
  return vehicle.description ?? vehicleFallbackDescription(vehicle);
}

/**
 * schema.org availability for each status. Shared by the inventory page's
 * ItemList and the detail page's Offer so the two can never disagree about
 * what "reserved" means to a search engine.
 */
export const AVAILABILITY: Record<Vehicle["status"], string> = {
  available: "https://schema.org/InStock",
  reserved: "https://schema.org/LimitedAvailability",
  sold: "https://schema.org/SoldOut",
};
