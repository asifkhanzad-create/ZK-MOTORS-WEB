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
  /** Path under /public, e.g. "/vehicles/corolla-altis.jpg". */
  image: string;
  /** Alt text describing the photo for screen readers. */
  imageAlt: string;
  /** Optional short highlight line shown on the card. */
  highlight?: string;
  featured?: boolean;
}
