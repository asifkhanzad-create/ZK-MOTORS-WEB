/**
 * Core domain types for ZK Motors.
 * Kept deliberately close to what a Supabase table would look like later,
 * so swapping the mock data source for a real query is a small change.
 */

export type VehicleStatus = "available" | "reserved" | "sold";

export type Transmission = "Automatic" | "Manual";

export type FuelType = "Petrol" | "Diesel" | "Hybrid" | "Electric";

export type BodyType = "Sedan" | "Hatchback" | "SUV" | "Crossover" | "Pickup";

export interface Vehicle {
  /** Stable slug — will become the detail-page route in Phase 3. */
  id: string;
  make: string;
  model: string;
  /** Trim / variant, e.g. "Altis Grande 1.8". */
  variant?: string;
  year: number;
  /** Whole rupees. Format with `formatPKR` before display. */
  price: number;
  /** Kilometres driven. */
  mileage: number;
  transmission: Transmission;
  fuel: FuelType;
  bodyType: BodyType;
  /** Registration city, e.g. "Islamabad". */
  registrationCity: string;
  status: VehicleStatus;
  /**
   * Absolute URL to the photo. Since Phase 5 this is a Supabase Storage URL
   * (`https://<ref>.supabase.co/storage/v1/object/public/vehicle-photos/…`);
   * it was a `/vehicles/…` path under /public before that, and both shapes still
   * appear in the seed SQL. Use `absoluteImageUrl()` before putting it in
   * metadata or structured data, which cannot take a relative path.
   */
  image: string;
  /** Alt text describing the photo for screen readers. */
  imageAlt: string;
  /** Optional short highlight line shown on the card. */
  highlight?: string;
  /**
   * Longer copy for the detail page. Kept optional so a listing can ship
   * without it — the page falls back to a generated line rather than
   * rendering an empty paragraph.
   */
  description?: string;
  /**
   * Extra photographs of the same car, beyond `image`. Empty for every
   * placeholder listing because only one photo per vehicle was sourced;
   * the detail gallery renders a thumbnail rail automatically once this
   * has entries. Phase 5 (real stock) is where it starts getting used.
   */
  gallery?: string[];
  featured?: boolean;
}

/**
 * A listing as the stock dashboard sees it: `Vehicle` plus the columns a visitor
 * is never sent.
 *
 * `toVehicle()` drops `published` on purpose — a public read is filtered to
 * published rows by row-level security, so if a row reached the app at all it
 * was published, and carrying the flag around invited code to branch on
 * something that could only ever be `true`. That reasoning holds for every
 * visitor-facing page and collapses completely in the admin, where drafts are
 * the whole point. Hence a second shape rather than an extra field on the first.
 *
 * The two are mapped side by side in `vehicle-mapper.ts` so a column added to
 * one is visible next to the other.
 */
export interface AdminVehicle extends Vehicle {
  /** Draft flag. Unpublished cars are invisible to visitors but listed here. */
  published: boolean;
  /** ISO timestamps, maintained by a trigger on update. */
  createdAt: string;
  updatedAt: string;
}
