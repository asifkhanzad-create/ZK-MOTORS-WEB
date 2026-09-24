/**
 * Unit tests for the database row → domain object mapping.
 *
 *     node --experimental-strip-types --test qa/unit-vehicle-mapper.mjs
 *
 * No database, no browser, no Supabase credentials — `toVehicle` is pure and
 * `src/lib/vehicle-mapper.ts` has only type imports, so Node's type stripping
 * can load it directly.
 *
 * Why this exists separately from the Playwright harnesses: the mapping is the
 * one piece of the Supabase work that can be wrong while everything else looks
 * fine. A mis-cased field or a `null` that should have been `undefined` does not
 * throw — it renders as an empty string or the literal text "null" in a spec
 * table. The end-to-end harnesses would catch that only if they happened to
 * assert on that exact field of that exact vehicle. Here it is checked directly.
 */

import assert from "node:assert/strict";
import test from "node:test";

import { toVehicle, toVehicleList } from "../src/lib/vehicle-mapper.ts";

/** A complete, valid row — every column present. */
const FULL_ROW = {
  id: "toyota-corolla-altis-grande-2021",
  make: "Toyota",
  model: "Corolla",
  variant: "Altis Grande 1.8",
  year: 2021,
  price: 8650000,
  mileage: 42000,
  transmission: "Automatic",
  fuel: "Petrol",
  body_type: "Sedan",
  registration_city: "Islamabad",
  status: "available",
  image: "/vehicles/corolla-altis.jpg",
  image_alt: "Black Toyota Corolla Altis Grande sedan parked outdoors",
  highlight: "Single owner, complete service history",
  description: "The Altis Grande is the top trim in the Corolla range.",
  gallery: ["/vehicles/corolla-altis-2.jpg"],
  featured: true,
  published: true,
  created_at: "2026-09-23T18:00:00.000Z",
  updated_at: "2026-09-23T18:00:00.000Z",
};

test("maps snake_case columns to camelCase fields", () => {
  const v = toVehicle(FULL_ROW);
  assert.equal(v.bodyType, "Sedan");
  assert.equal(v.registrationCity, "Islamabad");
  assert.equal(v.imageAlt, "Black Toyota Corolla Altis Grande sedan parked outdoors");
});

test("passes through fields whose names are identical in both shapes", () => {
  const v = toVehicle(FULL_ROW);
  assert.equal(v.id, FULL_ROW.id);
  assert.equal(v.make, "Toyota");
  assert.equal(v.model, "Corolla");
  assert.equal(v.year, 2021);
  assert.equal(v.price, 8650000);
  assert.equal(v.mileage, 42000);
  assert.equal(v.transmission, "Automatic");
  assert.equal(v.fuel, "Petrol");
  assert.equal(v.status, "available");
  assert.equal(v.image, "/vehicles/corolla-altis.jpg");
  assert.equal(v.featured, true);
});

test("converts null to undefined for optional fields", () => {
  const v = toVehicle({
    ...FULL_ROW,
    variant: null,
    highlight: null,
    description: null,
  });
  /* undefined, not null. `vehicle.description ?? fallback` treats both the same,
     but `variant` is rendered with a truthiness check and a spec row is skipped
     for it — so a null would be a latent inconsistency rather than a crash. */
  assert.equal(v.variant, undefined);
  assert.equal(v.highlight, undefined);
  assert.equal(v.description, undefined);
  assert.notEqual(v.variant, null);
});

test("collapses an empty gallery array to undefined", () => {
  const v = toVehicle({ ...FULL_ROW, gallery: [] });
  assert.equal(v.gallery, undefined);
});

test("keeps a populated gallery", () => {
  const v = toVehicle(FULL_ROW);
  assert.deepEqual(v.gallery, ["/vehicles/corolla-altis-2.jpg"]);
});

test("does not leak database-only columns into the domain object", () => {
  /* Catches the tempting `{ ...row, bodyType: row.body_type }` spread, which
     would put published / created_at / updated_at and every snake_case key onto
     the object the UI consumes. */
  const v = toVehicle(FULL_ROW);
  const keys = Object.keys(v).sort();
  assert.deepEqual(keys, [
    "bodyType",
    "description",
    "featured",
    "fuel",
    "gallery",
    "highlight",
    "id",
    "image",
    "imageAlt",
    "make",
    "mileage",
    "model",
    "price",
    "registrationCity",
    "status",
    "transmission",
    "variant",
    "year",
  ]);
  assert.equal("published" in v, false);
  assert.equal("created_at" in v, false);
  assert.equal("updated_at" in v, false);
  assert.equal("body_type" in v, false);
});

test("maps a list, preserving order", () => {
  const rows = [
    { ...FULL_ROW, id: "a", make: "Toyota" },
    { ...FULL_ROW, id: "b", make: "Honda" },
    { ...FULL_ROW, id: "c", make: "Suzuki" },
  ];
  const list = toVehicleList(rows);
  assert.equal(list.length, 3);
  assert.deepEqual(
    list.map((v) => v.id),
    ["a", "b", "c"],
  );
});

test("maps an empty list to an empty list", () => {
  assert.deepEqual(toVehicleList([]), []);
});
