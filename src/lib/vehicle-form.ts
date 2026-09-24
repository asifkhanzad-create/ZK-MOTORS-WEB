/**
 * The stock form's shape, shared by the action that validates it and the Client
 * Component that renders it.
 *
 * Separate from `src/app/admin/vehicle-actions.ts` because a `"use server"` file
 * may only export async functions — a plain object exported from one is a build
 * error, not a warning. Everything here is data and types, so it can be imported
 * from either side of the server/client boundary.
 */

import type { AdminVehicle } from "@/types/vehicle";

/**
 * Every field as a string, because that is what an input produces and what an
 * input must be given back.
 *
 * The Client Component owns these values. That is deliberate: React resets a
 * form once its action has run, and whether a changed `defaultValue` re-applies
 * to an already-mounted uncontrolled input is a subtlety not worth betting an
 * eighteen-field form on. Holding the values in state means a validation failure
 * cannot lose the admin's typing, whatever React does to the DOM.
 */
export type VehicleFormValues = {
  id: string;
  make: string;
  model: string;
  variant: string;
  year: string;
  price: string;
  mileage: string;
  transmission: string;
  fuel: string;
  bodyType: string;
  registrationCity: string;
  status: string;
  image: string;
  imageAlt: string;
  highlight: string;
  description: string;
  featured: string;
  published: string;
};

/**
 * What the action returns.
 *
 * Errors only — the values never travel back, because the client never let go of
 * them.
 */
export type VehicleFormState = {
  /** Field name → message. Empty when the submit was accepted. */
  errors: Record<string, string>;
  /** One line for the banner above the form. */
  message: string | null;
};

export const EMPTY_VEHICLE_FORM: VehicleFormValues = {
  id: "",
  make: "",
  model: "",
  variant: "",
  year: "",
  price: "",
  mileage: "",
  transmission: "",
  fuel: "",
  bodyType: "",
  registrationCity: "",
  status: "available",
  image: "",
  imageAlt: "",
  highlight: "",
  description: "",
  featured: "",
  /* Ticked by default: a car being added is one the client intends to sell, and
     an unpublished listing is invisible on the site. Opting in to invisibility
     is the safer default than opting out of it. */
  published: "on",
};

export const INITIAL_VEHICLE_FORM_STATE: VehicleFormState = {
  errors: {},
  message: null,
};

/** An existing listing, rendered back into form strings. */
export function vehicleToFormValues(vehicle: AdminVehicle): VehicleFormValues {
  return {
    id: vehicle.id,
    make: vehicle.make,
    model: vehicle.model,
    variant: vehicle.variant ?? "",
    year: String(vehicle.year),
    price: String(vehicle.price),
    mileage: String(vehicle.mileage),
    transmission: vehicle.transmission,
    fuel: vehicle.fuel,
    bodyType: vehicle.bodyType,
    registrationCity: vehicle.registrationCity,
    status: vehicle.status,
    image: vehicle.image,
    imageAlt: vehicle.imageAlt,
    highlight: vehicle.highlight ?? "",
    description: vehicle.description ?? "",
    featured: vehicle.featured ? "on" : "",
    published: vehicle.published ? "on" : "",
  };
}

/**
 * The three statuses a listing can hold, in the order they are offered.
 *
 * The transmission, fuel and body-type lists are deliberately **not** repeated
 * here — they come from `@/lib/facets`, which is where the rest of the app reads
 * them. A second copy is how a dropdown ends up offering a value the database
 * CHECK rejects.
 */
export const vehicleStatuses = ["available", "reserved", "sold"] as const;
