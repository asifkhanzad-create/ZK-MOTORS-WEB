"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdmin } from "@/lib/auth";
import { bodyTypes, fuelTypes, transmissions } from "@/lib/facets";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import {
  vehicleStatuses,
  type VehicleFormState,
  type VehicleFormValues,
} from "@/lib/vehicle-form";
import type { VehicleInsert } from "@/types/database";
import type { BodyType, FuelType, Transmission, VehicleStatus } from "@/types/vehicle";

/**
 * Every write the stock dashboard performs.
 *
 * Three rules hold for everything in this file:
 *
 *   1. **`requireAdmin()` runs first, always.** A Server Action is a public HTTP
 *      endpoint. Next's proxy never sees it, so an action that skipped this check
 *      would be callable by anyone who could guess its id — no login required.
 *   2. **Nothing from the form is trusted.** The browser's `required` and
 *      `type="number"` are conveniences; every value is re-parsed and re-checked
 *      here, because the form is not the only way to reach this code.
 *   3. **`revalidatePath` after every write.** The homepage, `/cars` and each
 *      detail page are prerendered with a 5-minute window, so without this a car
 *      marked sold stays on the site for up to five minutes. The timers are the
 *      backstop for edits made straight in the Supabase dashboard.
 */

const STORAGE_BUCKET = "vehicle-photos";

/* Ten megabytes. A modern phone photo is 2-5MB, so this is generous without
   being an invitation to fill the bucket. `next.config.ts` raises the Server
   Action body limit to 12MB so this check is the one that fires first and can
   name the actual limit in its message. */
const MAX_PHOTO_BYTES = 10 * 1024 * 1024;

const ALLOWED_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

/** Bounds are sanity checks, not business rules — they catch typos, not policy. */
const LIMITS = {
  id: { min: 3, max: 80 },
  make: { max: 40 },
  model: { max: 40 },
  variant: { max: 60 },
  city: { max: 40 },
  alt: { max: 200 },
  highlight: { max: 120 },
  description: { max: 1200 },
  price: { max: 500_000_000 },
  mileage: { max: 2_000_000 },
  yearMin: 1950,
} as const;

/* -------------------------------------------------------------------------- */
/* Revalidation                                                                */
/* -------------------------------------------------------------------------- */

/**
 * Make a write visible everywhere it is rendered.
 *
 * `/cars/[id]` with the `"page"` argument is how a dynamic segment is
 * invalidated — it covers every id, including one that has just been created and
 * therefore has no prerendered page to target individually.
 */
function revalidateStock() {
  revalidatePath("/"); // featured cars, recently sold
  revalidatePath("/cars"); // the inventory list
  revalidatePath("/cars/[id]", "page"); // every detail page
  revalidatePath("/sitemap.xml");
}

/* -------------------------------------------------------------------------- */
/* Reading and validating                                                      */
/* -------------------------------------------------------------------------- */

function text(formData: FormData, key: keyof VehicleFormValues) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

/** A checkbox is absent from FormData entirely when unchecked. */
function checked(formData: FormData, key: string) {
  return formData.get(key) !== null;
}

function readValues(formData: FormData): VehicleFormValues {
  return {
    id: text(formData, "id"),
    make: text(formData, "make"),
    model: text(formData, "model"),
    variant: text(formData, "variant"),
    year: text(formData, "year"),
    price: text(formData, "price"),
    mileage: text(formData, "mileage"),
    transmission: text(formData, "transmission"),
    fuel: text(formData, "fuel"),
    bodyType: text(formData, "bodyType"),
    registrationCity: text(formData, "registrationCity"),
    status: text(formData, "status"),
    image: text(formData, "image"),
    imageAlt: text(formData, "imageAlt"),
    highlight: text(formData, "highlight"),
    description: text(formData, "description"),
    featured: checked(formData, "featured") ? "on" : "",
    published: checked(formData, "published") ? "on" : "",
  };
}

/** Whole number within a range, or `null` if it is not one. */
function wholeNumber(raw: string, min: number, max: number): number | null {
  if (!/^\d+$/.test(raw)) return null;
  const value = Number(raw);
  if (!Number.isFinite(value) || value < min || value > max) return null;
  return value;
}

function oneOf<T extends string>(raw: string, allowed: readonly T[]): T | null {
  return (allowed as readonly string[]).includes(raw) ? (raw as T) : null;
}

/**
 * Validate every field and report all problems at once.
 *
 * All at once rather than one per submit: eighteen fields with one error
 * revealed per attempt is a miserable form to fill in.
 */
function validate(values: VehicleFormValues, options: { isNew: boolean; hasPhoto: boolean }) {
  const errors: Record<string, string> = {};

  const slug = values.id.toLowerCase();
  if (!slug) {
    errors.id = "Enter an address for this car.";
  } else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    errors.id = "Use lowercase letters, numbers and single hyphens only.";
  } else if (slug.length < LIMITS.id.min || slug.length > LIMITS.id.max) {
    errors.id = `Keep this between ${LIMITS.id.min} and ${LIMITS.id.max} characters.`;
  }

  if (!values.make) errors.make = "Enter the make.";
  else if (values.make.length > LIMITS.make.max) errors.make = "Too long.";

  if (!values.model) errors.model = "Enter the model.";
  else if (values.model.length > LIMITS.model.max) errors.model = "Too long.";

  if (values.variant.length > LIMITS.variant.max) errors.variant = "Too long.";

  const currentYear = new Date().getFullYear();
  const year = wholeNumber(values.year, LIMITS.yearMin, currentYear + 1);
  if (year === null) {
    errors.year = `Enter a year between ${LIMITS.yearMin} and ${currentYear + 1}.`;
  }

  const price = wholeNumber(values.price, 1, LIMITS.price.max);
  if (price === null) errors.price = "Enter the price in whole rupees.";

  const mileage = wholeNumber(values.mileage, 0, LIMITS.mileage.max);
  if (mileage === null) errors.mileage = "Enter the mileage in whole kilometres.";

  if (!oneOf(values.transmission, transmissions)) errors.transmission = "Choose a transmission.";
  if (!oneOf(values.fuel, fuelTypes)) errors.fuel = "Choose a fuel type.";
  if (!oneOf(values.bodyType, bodyTypes)) errors.bodyType = "Choose a body type.";

  if (!values.registrationCity) errors.registrationCity = "Enter the registration city.";
  else if (values.registrationCity.length > LIMITS.city.max) errors.registrationCity = "Too long.";

  if (!oneOf(values.status, vehicleStatuses)) errors.status = "Choose a status.";

  /* Alt text is required, not optional. Every vehicle photo is meaningful
     content, and a listing without it is unreadable to a screen reader — the
     existing rows all carry it, so this keeps new ones at the same standard. */
  if (!values.imageAlt) errors.imageAlt = "Describe the photo for screen readers.";
  else if (values.imageAlt.length > LIMITS.alt.max) errors.imageAlt = "Too long.";

  if (values.highlight.length > LIMITS.highlight.max) errors.highlight = "Too long.";
  if (values.description.length > LIMITS.description.max) errors.description = "Too long.";

  if (!values.image && !options.hasPhoto) {
    errors.image = options.isNew
      ? "Choose a photo."
      : "This listing has no photo — upload one.";
  }

  return { errors, year, price, mileage };
}

/* -------------------------------------------------------------------------- */
/* Photo upload                                                                */
/* -------------------------------------------------------------------------- */

function extensionFor(file: File) {
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  return "jpg";
}

/**
 * Put the photo in Storage and return its public URL.
 *
 * The filename is derived from the listing id plus a timestamp. Two reasons:
 * a readable name makes the bucket browsable by hand, and the timestamp means
 * re-uploading a replacement never overwrites the old file — so a listing that
 * is still cached somewhere cannot suddenly show a different car.
 *
 * The upload runs on the signed-in admin's client, so Storage's own row-level
 * security decides whether it is allowed. See
 * `supabase/migrations/0002_admin_access.sql`.
 */
async function uploadPhoto(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  file: File,
  slug: string,
): Promise<{ url: string } | { error: string }> {
  if (!ALLOWED_PHOTO_TYPES.includes(file.type as (typeof ALLOWED_PHOTO_TYPES)[number])) {
    return { error: "Use a JPEG, PNG or WebP image." };
  }
  if (file.size > MAX_PHOTO_BYTES) {
    return { error: `That image is ${Math.round(file.size / 1024 / 1024)}MB. The limit is 10MB.` };
  }

  const path = `${slug}-${Date.now()}.${extensionFor(file)}`;

  const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(path, file, {
    contentType: file.type,
    upsert: false,
  });

  if (error) {
    console.error("[admin] photo upload failed:", error.message);
    return { error: "The photo could not be uploaded. Try again." };
  }

  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);
  return { url: data.publicUrl };
}

/* -------------------------------------------------------------------------- */
/* Create / update                                                             */
/* -------------------------------------------------------------------------- */

export async function saveVehicle(
  _previous: VehicleFormState,
  formData: FormData,
): Promise<VehicleFormState> {
  await requireAdmin();

  const isNew = formData.get("mode") === "create";
  const values = readValues(formData);

  /* The id is the URL of the car. Changing it would break every existing link
     and quietly orphan the old page, so on edit it is carried in a hidden field
     and the field itself is read-only. */
  if (!isNew) values.id = String(formData.get("originalId") ?? values.id).trim();

  const photo = formData.get("photo");
  const hasPhoto = photo instanceof File && photo.size > 0;

  const { errors, year, price, mileage } = validate(values, { isNew, hasPhoto });
  if (Object.keys(errors).length > 0) {
    return { errors, message: "Check the highlighted fields." };
  }

  const supabase = await createSupabaseServerClient();

  let image = values.image;
  if (hasPhoto) {
    const uploaded = await uploadPhoto(supabase, photo as File, values.id.toLowerCase());
    if ("error" in uploaded) {
      return { errors: { image: uploaded.error }, message: "The photo was not saved." };
    }
    image = uploaded.url;
  }

  /* Everything except the primary key. The id is added only on insert and is
     never updated — it is the car's page address, so changing it would break
     every existing link and leave the old detail page cached under a slug that
     no longer exists. Keeping it out of this object means there is no way for
     the update path to include it by accident. */
  const fields: Omit<VehicleInsert, "id"> = {
    make: values.make,
    model: values.model,
    variant: values.variant || null,
    year: year!,
    price: price!,
    mileage: mileage!,
    transmission: oneOf(values.transmission, transmissions) as Transmission,
    fuel: oneOf(values.fuel, fuelTypes) as FuelType,
    body_type: oneOf(values.bodyType, bodyTypes) as BodyType,
    registration_city: values.registrationCity,
    status: oneOf(values.status, vehicleStatuses) as VehicleStatus,
    image,
    image_alt: values.imageAlt,
    highlight: values.highlight || null,
    description: values.description || null,
    featured: values.featured === "on",
    published: values.published === "on",
  };

  if (isNew) {
    const { error } = await supabase
      .from("vehicles")
      .insert({ ...fields, id: values.id.toLowerCase() });

    if (error) {
      console.error("[admin] insert failed:", error.message);
      /* 23505 is a unique-violation. It is the one database error worth
         surfacing verbatim, because the fix is in the admin's hands: the
         address they chose is already taken by another car. */
      if (error.code === "23505") {
        return {
          errors: { id: "That address is already used by another car." },
          message: "Check the highlighted fields.",
        };
      }
      return { errors: {}, message: `Could not save: ${error.message}` };
    }
  } else {
    const { error } = await supabase.from("vehicles").update(fields).eq("id", values.id);

    if (error) {
      console.error("[admin] update failed:", error.message);
      return { errors: {}, message: `Could not save: ${error.message}` };
    }
  }

  revalidateStock();

  /* Outside any try/catch: `redirect()` works by throwing. */
  redirect(`/admin?saved=${encodeURIComponent(values.id.toLowerCase())}`);
}

/* -------------------------------------------------------------------------- */
/* Quick actions from the list                                                 */
/* -------------------------------------------------------------------------- */

/**
 * One-click controls on the list page.
 *
 * Each is a plain form post, so they work with JavaScript unavailable. They
 * redirect back with a query flag rather than returning state, because there is
 * no per-row form state to preserve.
 */
export async function setVehicleStatus(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const status = oneOf(String(formData.get("status") ?? ""), vehicleStatuses);
  if (!id || !status) return;

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("vehicles").update({ status }).eq("id", id);

  if (error) console.error("[admin] status update failed:", error.message);
  else revalidateStock();
}

export async function togglePublished(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const published = formData.get("published") === "true";
  if (!id) return;

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("vehicles").update({ published }).eq("id", id);

  if (error) console.error("[admin] publish toggle failed:", error.message);
  else revalidateStock();
}

export async function toggleFeatured(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const featured = formData.get("featured") === "true";
  if (!id) return;

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("vehicles").update({ featured }).eq("id", id);

  if (error) console.error("[admin] feature toggle failed:", error.message);
  else revalidateStock();
}

/**
 * Permanent removal.
 *
 * This is the hard delete; the reversible option is unpublishing, and the button
 * that calls this says so. The photo is deliberately **left in Storage** —
 * filenames carry a timestamp so no two listings share one, but deleting an
 * object is irreversible while an orphaned file costs a few hundred kilobytes.
 * Wrong in the recoverable direction.
 */
export async function deleteVehicle(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("vehicles").delete().eq("id", id);

  if (error) {
    console.error("[admin] delete failed:", error.message);
    redirect(`/admin?error=${encodeURIComponent("That car could not be deleted.")}`);
  }

  revalidateStock();
  redirect(`/admin?deleted=${encodeURIComponent(id)}`);
}
