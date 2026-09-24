"use client";

import { AlertCircle, ImageUp } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useActionState, useState } from "react";

import { saveVehicle } from "@/app/admin/vehicle-actions";
import { buttonClasses } from "@/components/ui/Button";
import { controlClass, describedBy, fieldBorder, FieldShell } from "@/components/ui/Field";
import { bodyTypes, fuelTypes, transmissions } from "@/lib/facets";
import { cn } from "@/lib/utils";
import {
  INITIAL_VEHICLE_FORM_STATE,
  vehicleStatuses,
  type VehicleFormValues,
} from "@/lib/vehicle-form";

/**
 * Add or edit one listing.
 *
 * ## Why the values live in React state
 *
 * React resets a form once its action has run, and whether a changed
 * `defaultValue` re-applies to an input that is already mounted is a subtlety
 * worth not betting an eighteen-field form on. Holding the values here means a
 * rejected submit cannot lose the description the admin just wrote — the client
 * never let go of it, so there is nothing to restore.
 *
 * The server therefore returns errors only, and never echoes values back.
 *
 * ## Fields are uncontrolled only where they must be
 *
 * The file input is uncontrolled because a `File` cannot be set
 * programmatically, and that is fine: re-picking a photo after an unrelated
 * validation error is a small cost, and the photo is the one field the admin
 * just interacted with.
 */

/** A text-like control, wired to the shared field primitives. */
function TextInput({
  id,
  label,
  value,
  onChange,
  error,
  hint,
  type = "text",
  inputMode,
  placeholder,
  readOnly,
  className,
}: {
  id: keyof VehicleFormValues;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  hint?: string;
  type?: string;
  inputMode?: "text" | "numeric";
  placeholder?: string;
  readOnly?: boolean;
  className?: string;
}) {
  return (
    <FieldShell id={id} label={label} error={error} hint={hint} className={className}>
      <input
        id={id}
        name={id}
        type={type}
        inputMode={inputMode}
        placeholder={placeholder}
        readOnly={readOnly}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, error, hint)}
        className={cn(
          controlClass,
          fieldBorder(error),
          readOnly && "cursor-not-allowed bg-bone-100 text-muted-light",
        )}
      />
    </FieldShell>
  );
}

/** A native select. Same chevron-free treatment as the rest of the site. */
function SelectInput({
  id,
  label,
  value,
  onChange,
  options,
  error,
  hint,
  className,
}: {
  id: keyof VehicleFormValues;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly string[];
  error?: string;
  hint?: string;
  className?: string;
}) {
  return (
    <FieldShell id={id} label={label} error={error} hint={hint} className={className}>
      <select
        id={id}
        name={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, error, hint)}
        className={cn(controlClass, "cursor-pointer", fieldBorder(error), !value && "text-ink-400")}
      >
        <option value="">Choose…</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </FieldShell>
  );
}

/** Turns "Toyota", "Corolla", "Altis Grande 1.8", 2021 into a URL slug. */
function slugify(...parts: string[]) {
  return parts
    .join(" ")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

export function VehicleForm({
  mode,
  initialValues,
  currentImage,
}: {
  mode: "create" | "edit";
  initialValues: VehicleFormValues;
  /** The listing's existing photo, shown as a preview. Absent for a new car. */
  currentImage?: string;
}) {
  const [values, setValues] = useState<VehicleFormValues>(initialValues);
  const [state, formAction, pending] = useActionState(saveVehicle, INITIAL_VEHICLE_FORM_STATE);
  const { errors, message } = state;

  function set<K extends keyof VehicleFormValues>(key: K, value: string) {
    setValues((previous) => ({ ...previous, [key]: value }));
  }

  const isNew = mode === "create";
  const image = currentImage ?? values.image;

  return (
    <form action={formAction} className="flex flex-col gap-6">
      {/* Read by the action. `mode` decides insert vs update; `originalId` is the
          immutable key, because the visible slug field is read-only on edit. */}
      <input type="hidden" name="mode" value={mode} />
      {!isNew ? <input type="hidden" name="originalId" value={initialValues.id} /> : null}
      {/* Carries the existing photo URL so editing a description does not wipe
          the image. Replaced server-side only if a new file is uploaded. */}
      <input type="hidden" name="image" value={values.image} />

      {message ? (
        <p
          role="alert"
          className="flex items-start gap-2.5 rounded-2xl border border-signal-200 bg-signal-200/25 p-4 text-sm text-ink-900"
        >
          <AlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-signal-600" />
          <span>{message}</span>
        </p>
      ) : null}

      <fieldset className="rounded-card border border-bone-200 bg-white p-5 sm:p-6">
        <legend className="px-1 text-sm font-semibold text-ink-950">The car</legend>

        <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2">
          <TextInput
            id="make"
            label="Make"
            value={values.make}
            onChange={(value) => set("make", value)}
            error={errors.make}
            placeholder="Toyota"
          />
          <TextInput
            id="model"
            label="Model"
            value={values.model}
            onChange={(value) => set("model", value)}
            error={errors.model}
            placeholder="Corolla"
          />
          <TextInput
            id="variant"
            label="Variant"
            value={values.variant}
            onChange={(value) => set("variant", value)}
            error={errors.variant}
            hint="Optional. The trim, e.g. “Altis Grande 1.8”."
            placeholder="Altis Grande 1.8"
          />
          <TextInput
            id="year"
            label="Year"
            value={values.year}
            onChange={(value) => set("year", value)}
            error={errors.year}
            inputMode="numeric"
            placeholder="2021"
          />
          <SelectInput
            id="transmission"
            label="Transmission"
            value={values.transmission}
            onChange={(value) => set("transmission", value)}
            options={transmissions}
            error={errors.transmission}
          />
          <SelectInput
            id="fuel"
            label="Fuel"
            value={values.fuel}
            onChange={(value) => set("fuel", value)}
            options={fuelTypes}
            error={errors.fuel}
          />
          <SelectInput
            id="bodyType"
            label="Body type"
            value={values.bodyType}
            onChange={(value) => set("bodyType", value)}
            options={bodyTypes}
            error={errors.bodyType}
          />
          <TextInput
            id="registrationCity"
            label="Registration city"
            value={values.registrationCity}
            onChange={(value) => set("registrationCity", value)}
            error={errors.registrationCity}
            placeholder="Islamabad"
          />
          <TextInput
            id="price"
            label="Price (PKR)"
            value={values.price}
            onChange={(value) => set("price", value)}
            error={errors.price}
            inputMode="numeric"
            hint="Whole rupees, no commas."
            placeholder="8650000"
          />
          <TextInput
            id="mileage"
            label="Mileage (km)"
            value={values.mileage}
            onChange={(value) => set("mileage", value)}
            error={errors.mileage}
            inputMode="numeric"
            placeholder="42000"
          />
        </div>
      </fieldset>

      <fieldset className="rounded-card border border-bone-200 bg-white p-5 sm:p-6">
        <legend className="px-1 text-sm font-semibold text-ink-950">Photo</legend>

        <div className="mt-4 flex flex-col gap-5">
          {image ? (
            <div className="flex items-center gap-4">
              <Image
                src={image}
                alt=""
                width={160}
                height={120}
                sizes="160px"
                className="h-[120px] w-[160px] rounded-xl object-cover"
              />
              <p className="text-xs leading-relaxed text-muted-light">
                {isNew
                  ? "This photo will be used once the car is saved."
                  : "Choose a file below only if you want to replace this photo."}
              </p>
            </div>
          ) : null}

          <FieldShell
            id="photo"
            label={isNew ? "Choose a photo" : "Replace the photo"}
            error={errors.image}
            hint="JPEG, PNG or WebP, up to 10MB. Portrait photos get cropped to landscape on the site."
          >
            <div className="flex items-center gap-3">
              <ImageUp aria-hidden="true" className="size-5 shrink-0 text-muted-light" />
              <input
                id="photo"
                name="photo"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                aria-describedby={describedBy("photo", errors.image, "photo-hint")}
                className={cn(
                  "w-full rounded-xl border bg-white px-3 py-2.5 text-sm text-ink-900",
                  "file:mr-3 file:rounded-full file:border-0 file:bg-ink-950/5 file:px-3 file:py-1.5",
                  "file:text-xs file:font-semibold file:text-ink-900",
                  fieldBorder(errors.image),
                )}
              />
            </div>
          </FieldShell>

          <TextInput
            id="imageAlt"
            label="Photo description"
            value={values.imageAlt}
            onChange={(value) => set("imageAlt", value)}
            error={errors.imageAlt}
            hint="Read aloud to visitors using a screen reader. Describe the car and the angle."
            placeholder="Black Toyota Corolla sedan parked outdoors, front view"
          />
        </div>
      </fieldset>

      <fieldset className="rounded-card border border-bone-200 bg-white p-5 sm:p-6">
        <legend className="px-1 text-sm font-semibold text-ink-950">Listing text</legend>

        <div className="mt-4 flex flex-col gap-5">
          <TextInput
            id="highlight"
            label="Highlight"
            value={values.highlight}
            onChange={(value) => set("highlight", value)}
            error={errors.highlight}
            hint="Optional. One short line shown on the card, e.g. “Single owner, complete service history”."
          />

          <FieldShell
            id="description"
            label="Description"
            error={errors.description}
            hint="Shown on the car's own page. Optional — leave it blank and the page writes a summary from the details above."
          >
            <textarea
              id="description"
              name="description"
              rows={5}
              value={values.description}
              onChange={(event) => set("description", event.target.value)}
              aria-invalid={errors.description ? true : undefined}
              aria-describedby={describedBy("description", errors.description, "description-hint")}
              className={cn(controlClass, "h-auto py-3", fieldBorder(errors.description))}
            />
          </FieldShell>

          <TextInput
            id="id"
            label="Web address"
            value={values.id}
            onChange={(value) => set("id", value)}
            error={errors.id}
            readOnly={!isNew}
            hint={
              isNew
                ? "Lowercase letters, numbers and hyphens. This becomes the page address, so it cannot be changed later."
                : "The page address. Fixed once the car is created, so existing links keep working."
            }
            placeholder="toyota-corolla-altis-grande-2021"
          />

          {isNew ? (
            <button
              type="button"
              onClick={() =>
                set(
                  "id",
                  slugify(values.make, values.model, values.variant, values.year),
                )
              }
              className={buttonClasses({
                variant: "ghostLight",
                size: "sm",
                className: "-mt-3 self-start",
              })}
            >
              Build it from the details above
            </button>
          ) : null}
        </div>
      </fieldset>

      <fieldset className="rounded-card border border-bone-200 bg-white p-5 sm:p-6">
        <legend className="px-1 text-sm font-semibold text-ink-950">On the site</legend>

        <div className="mt-4 flex flex-col gap-4">
          <SelectInput
            id="status"
            label="Status"
            value={values.status}
            onChange={(value) => set("status", value)}
            options={vehicleStatuses}
            error={errors.status}
            className="max-w-xs"
          />

          <label className="flex items-start gap-3 text-sm text-ink-900">
            <input
              type="checkbox"
              name="published"
              checked={values.published === "on"}
              onChange={(event) => set("published", event.target.checked ? "on" : "")}
              className="mt-0.5 size-4 shrink-0 accent-accent-500"
            />
            <span>
              <span className="font-medium">Show on the website</span>
              <span className="mt-0.5 block text-xs text-muted-light">
                Untick to keep it as a draft. Drafts are invisible to visitors and
                stay in this list.
              </span>
            </span>
          </label>

          <label className="flex items-start gap-3 text-sm text-ink-900">
            <input
              type="checkbox"
              name="featured"
              checked={values.featured === "on"}
              onChange={(event) => set("featured", event.target.checked ? "on" : "")}
              className="mt-0.5 size-4 shrink-0 accent-accent-500"
            />
            <span>
              <span className="font-medium">Feature on the homepage</span>
              <span className="mt-0.5 block text-xs text-muted-light">
                Featured cars appear in the homepage grid. It takes more than one
                to fill it.
              </span>
            </span>
          </label>
        </div>
      </fieldset>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className={buttonClasses({ variant: "primary", size: "lg" })}
        >
          {pending ? "Saving…" : isNew ? "Add the car" : "Save changes"}
        </button>

        <Link
          href="/admin"
          className={buttonClasses({ variant: "outlineLight", size: "lg" })}
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
