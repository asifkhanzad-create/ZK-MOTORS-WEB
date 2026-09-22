"use client";

import { AlertCircle, ChevronDown, MessageCircle, Phone, Send } from "lucide-react";
import { useId, useRef, useState, type FormEvent, type ReactNode } from "react";

import { buttonClasses } from "@/components/ui/Button";
import { siteConfig } from "@/config/site";
import { getFuelTypes, getMakes, getTransmissions } from "@/data/vehicles";
import { cn } from "@/lib/utils";
import { buildWhatsAppUrl, sellVehicleMessage } from "@/lib/whatsapp";

/* ============================================================================
 * Sell-your-car valuation form
 * ============================================================================
 * There is no backend until Phase 5, so this form does not POST anywhere. It
 * composes a WhatsApp message from what the visitor typed and hands them to
 * WhatsApp, where they still have to press send themselves. The panel after
 * submitting says so plainly rather than implying something was transmitted —
 * a form that looks like it sent and did not is worse than no form.
 *
 * Everything is a native control: a <select>, a plain <input>, a <datalist>
 * for make. No combobox library, no custom keyboard handling, nothing that
 * breaks on a cheap Android browser — which is what most of this traffic is.
 *
 * Field naming: `id` is unique per render (`useId`), but `name` and
 * `data-field` are the plain key. `useId()` returns characters such as `«` and
 * `»`, which are not usable inside a CSS attribute selector, so the
 * focus-the-first-error lookup goes through `data-field` instead. Keeping
 * `name` plain also lets browser autofill recognise the name and phone fields.
 * ========================================================================== */

type Values = {
  make: string;
  model: string;
  year: string;
  mileage: string;
  transmission: string;
  fuel: string;
  city: string;
  condition: string;
  expectedPrice: string;
  name: string;
  phone: string;
  notes: string;
};

const EMPTY: Values = {
  make: "",
  model: "",
  year: "",
  mileage: "",
  transmission: "",
  fuel: "",
  city: "",
  condition: "",
  expectedPrice: "",
  name: "",
  phone: "",
  notes: "",
};

type Errors = Partial<Record<keyof Values, string>>;

/** Cities offered in the dropdown — the service area, plus an escape hatch. */
const CITIES = [...siteConfig.areasServed, "Somewhere else"];

const labelClass =
  "text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-muted-light";

const controlClass =
  "h-12 w-full rounded-xl border bg-white px-3.5 text-[0.9375rem] text-ink-900 " +
  "transition-colors duration-200 placeholder:text-ink-400";

/** Digits only, so "+92 300 123 4567" and "03001234567" both validate. */
function digitsOf(value: string) {
  return value.replace(/\D/g, "");
}

function validate(values: Values): Errors {
  const errors: Errors = {};

  if (!values.make.trim()) errors.make = "Enter the make.";
  if (!values.model.trim()) errors.model = "Enter the model.";

  const year = Number(values.year);
  const thisYear = new Date().getFullYear();
  if (!values.year.trim()) {
    errors.year = "Enter the model year.";
  } else if (!Number.isInteger(year) || year < 1950 || year > thisYear + 1) {
    errors.year = `Enter a year between 1950 and ${thisYear + 1}.`;
  }

  const mileage = Number(values.mileage);
  if (!values.mileage.trim()) {
    errors.mileage = "Enter the mileage.";
  } else if (!Number.isFinite(mileage) || mileage < 0 || mileage > 2_000_000) {
    errors.mileage = "Enter the mileage in kilometres.";
  }

  if (!values.transmission) errors.transmission = "Choose a transmission.";
  if (!values.fuel) errors.fuel = "Choose a fuel type.";
  if (!values.city) errors.city = "Choose a city.";
  if (!values.condition) errors.condition = "Choose a condition.";

  if (values.expectedPrice.trim()) {
    const price = Number(values.expectedPrice);
    if (!Number.isFinite(price) || price <= 0) {
      errors.expectedPrice = "Enter an amount in PKR, or leave this blank.";
    }
  }

  if (!values.name.trim()) errors.name = "Enter your name.";

  const phoneDigits = digitsOf(values.phone);
  if (!values.phone.trim()) {
    errors.phone = "Enter a phone number.";
  } else if (phoneDigits.length < 10) {
    errors.phone = "Enter a full phone number, including the code.";
  }

  return errors;
}

/* -------------------------------------------------------------------------- */
/* Field primitives                                                            */
/* -------------------------------------------------------------------------- */

function FieldShell({
  id,
  label,
  hint,
  error,
  className,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      {children}
      {/* One description slot: the error replaces the hint rather than sitting
          beside it, so a screen reader never reads two competing sentences. */}
      {error ? (
        <p id={`${id}-error`} className="flex items-center gap-1.5 text-xs text-signal-600">
          <AlertCircle aria-hidden="true" className="size-3.5 shrink-0" />
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-xs text-ink-400">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

function describedBy(id: string, error?: string, hint?: string) {
  if (error) return `${id}-error`;
  if (hint) return `${id}-hint`;
  return undefined;
}

function TextField({
  id,
  name,
  label,
  value,
  onChange,
  hint,
  error,
  type = "text",
  inputMode,
  autoComplete,
  placeholder,
  list,
  className,
}: {
  id: string;
  name: keyof Values;
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  error?: string;
  type?: string;
  inputMode?: "text" | "numeric" | "tel";
  autoComplete?: string;
  placeholder?: string;
  list?: string;
  className?: string;
}) {
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} className={className}>
      <input
        id={id}
        name={name}
        data-field={name}
        type={type}
        inputMode={inputMode}
        autoComplete={autoComplete}
        list={list}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, error, hint)}
        className={cn(controlClass, error ? "border-signal-400" : "border-bone-300")}
      />
    </FieldShell>
  );
}

function SelectField({
  id,
  name,
  label,
  value,
  onChange,
  options,
  placeholder,
  error,
  className,
}: {
  id: string;
  name: keyof Values;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly string[];
  placeholder: string;
  error?: string;
  className?: string;
}) {
  return (
    <FieldShell id={id} label={label} error={error} className={className}>
      <div className="relative">
        <select
          id={id}
          name={name}
          data-field={name}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(id, error)}
          className={cn(
            controlClass,
            "cursor-pointer appearance-none pr-10",
            error ? "border-signal-400" : "border-bone-300",
            !value && "text-ink-400",
          )}
        >
          <option value="">{placeholder}</option>
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <ChevronDown
          aria-hidden="true"
          className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-light"
        />
      </div>
    </FieldShell>
  );
}

/* -------------------------------------------------------------------------- */

export function ValuationForm() {
  const uid = useId();
  const [values, setValues] = useState<Values>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [submitted, setSubmitted] = useState<{ url: string; message: string } | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const makes = getMakes();
  const makeListId = `${uid}-makes`;

  function set<K extends keyof Values>(key: K) {
    return (value: Values[K]) => {
      setValues((previous) => ({ ...previous, [key]: value }));
      /* Clear the error as soon as the visitor edits the field — leaving a
         stale message under a corrected input reads as a broken form. */
      setErrors((previous) => {
        if (!previous[key]) return previous;
        const next = { ...previous };
        delete next[key];
        return next;
      });
    };
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const found = validate(values);
    setErrors(found);

    const firstInvalid = (Object.keys(found) as (keyof Values)[])[0];
    if (firstInvalid) {
      /* Focus the first problem rather than only colouring it. This reads
         `data-field`, which is on the control from first render — an
         `[aria-invalid]` lookup would run before React has re-rendered and
         find nothing. */
      formRef.current
        ?.querySelector<HTMLElement>(`[data-field="${firstInvalid}"]`)
        ?.focus();
      setSubmitted(null);
      return;
    }

    const message = sellVehicleMessage({
      make: values.make.trim(),
      model: values.model.trim(),
      year: Number(values.year),
      mileage: Number(values.mileage),
      transmission: values.transmission,
      fuel: values.fuel,
      city: values.city,
      condition: values.condition,
      expectedPrice: values.expectedPrice.trim() ? Number(values.expectedPrice) : undefined,
      name: values.name.trim(),
      phone: values.phone.trim(),
      notes: values.notes.trim() || undefined,
    });

    const url = buildWhatsAppUrl(message);
    if (!url) return;

    /* Opened from a submit handler, so it counts as a user gesture and is not
       blocked. The confirmation panel still offers the link by hand, because
       a pop-up blocker or an in-app browser can swallow this. */
    window.open(url, "_blank", "noopener,noreferrer");
    setSubmitted({ url, message });
  }

  const errorCount = Object.keys(errors).length;

  return (
    <form
      ref={formRef}
      onSubmit={onSubmit}
      noValidate
      className="rounded-card border border-bone-200 bg-white p-5 shadow-[0_18px_40px_-28px_rgba(10,11,13,0.35)] sm:p-7"
    >
      {/* Native validation is off so the messages stay in one voice and land
          next to the field. This announces the count when submit fails. */}
      <div aria-live="polite" className="sr-only">
        {errorCount > 0
          ? `${errorCount} ${errorCount === 1 ? "field needs" : "fields need"} attention.`
          : ""}
      </div>

      <datalist id={makeListId}>
        {makes.map((make) => (
          <option key={make} value={make} />
        ))}
      </datalist>

      <fieldset className="flex flex-col gap-5">
        <legend className="mb-2 text-lg font-semibold text-ink-950">Your car</legend>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <TextField
            id={`${uid}make`}
            name="make"
            label="Make"
            value={values.make}
            onChange={set("make")}
            error={errors.make}
            placeholder="e.g. Toyota"
            list={makeListId}
            hint="Start typing — known makes are suggested."
          />
          <TextField
            id={`${uid}model`}
            name="model"
            label="Model"
            value={values.model}
            onChange={set("model")}
            error={errors.model}
            placeholder="e.g. Corolla Altis Grande"
          />
          <TextField
            id={`${uid}year`}
            name="year"
            label="Model year"
            value={values.year}
            onChange={set("year")}
            error={errors.year}
            type="number"
            inputMode="numeric"
            placeholder="e.g. 2019"
          />
          <TextField
            id={`${uid}mileage`}
            name="mileage"
            label="Mileage"
            value={values.mileage}
            onChange={set("mileage")}
            error={errors.mileage}
            type="number"
            inputMode="numeric"
            placeholder="e.g. 78000"
            hint="In kilometres."
          />
          <SelectField
            id={`${uid}transmission`}
            name="transmission"
            label="Transmission"
            value={values.transmission}
            onChange={set("transmission")}
            options={getTransmissions()}
            placeholder="Select transmission"
            error={errors.transmission}
          />
          <SelectField
            id={`${uid}fuel`}
            name="fuel"
            label="Fuel"
            value={values.fuel}
            onChange={set("fuel")}
            options={getFuelTypes()}
            placeholder="Select fuel type"
            error={errors.fuel}
          />
          <SelectField
            id={`${uid}city`}
            name="city"
            label="City"
            value={values.city}
            onChange={set("city")}
            options={CITIES}
            placeholder="Select city"
            error={errors.city}
          />
          <SelectField
            id={`${uid}condition`}
            name="condition"
            label="Condition"
            value={values.condition}
            onChange={set("condition")}
            options={siteConfig.sell.conditions}
            placeholder="Select condition"
            error={errors.condition}
          />
          <TextField
            id={`${uid}expectedPrice`}
            name="expectedPrice"
            label="Expected price"
            value={values.expectedPrice}
            onChange={set("expectedPrice")}
            error={errors.expectedPrice}
            type="number"
            inputMode="numeric"
            placeholder="e.g. 5400000"
            hint="Optional. Full amount in PKR."
            className="sm:col-span-2"
          />
        </div>
      </fieldset>

      <fieldset className="mt-7 flex flex-col gap-5 border-t border-bone-200 pt-7">
        <legend className="mb-2 text-lg font-semibold text-ink-950">
          How we reach you
        </legend>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <TextField
            id={`${uid}name`}
            name="name"
            label="Your name"
            value={values.name}
            onChange={set("name")}
            error={errors.name}
            autoComplete="name"
            placeholder="e.g. Ahmed"
          />
          <TextField
            id={`${uid}phone`}
            name="phone"
            label="Phone or WhatsApp"
            value={values.phone}
            onChange={set("phone")}
            error={errors.phone}
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="e.g. 0300 1234567"
          />
          <div className="flex flex-col gap-2 sm:col-span-2">
            <label htmlFor={`${uid}notes`} className={labelClass}>
              Anything else
            </label>
            <textarea
              id={`${uid}notes`}
              name="notes"
              data-field="notes"
              rows={3}
              value={values.notes}
              onChange={(event) => set("notes")(event.target.value)}
              placeholder="Accident history, recent work, documents, urgency — anything that helps."
              className={cn(
                controlClass,
                "h-auto resize-y border-bone-300 py-3 leading-relaxed",
              )}
            />
          </div>
        </div>
      </fieldset>

      <div className="mt-7 flex flex-col gap-4 border-t border-bone-200 pt-7">
        <button
          type="submit"
          className={buttonClasses({
            variant: "primarySignal",
            size: "lg",
            className: "w-full sm:w-auto",
          })}
        >
          <Send aria-hidden="true" className="size-4" />
          Send details on WhatsApp
        </button>

        <p className="text-sm leading-relaxed text-muted-light">
          This opens WhatsApp with your details written out.{" "}
          <strong className="font-semibold text-ink-900">
            Nothing is sent until you press send there.
          </strong>{" "}
          Prefer to talk?{" "}
          <a
            href={`tel:${siteConfig.contact.phoneE164}`}
            className="font-medium text-ink-900 underline decoration-ink-400 underline-offset-2 transition-colors hover:text-signal-600"
          >
            {siteConfig.contact.phoneDisplay}
          </a>
        </p>
      </div>

      {/* ---------------------------------------------------------------- */}
      {submitted ? (
        <div
          role="status"
          className="mt-7 rounded-2xl border border-signal-200 bg-signal-200/25 p-5 sm:p-6"
        >
          <h3 className="flex items-center gap-2 text-base font-semibold text-ink-950">
            <MessageCircle aria-hidden="true" className="size-4 text-signal-600" />
            WhatsApp should have opened in a new tab
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-light">
            If it did not — a pop-up blocker or an in-app browser will stop it —
            use the link below. Press send inside WhatsApp to reach us.
          </p>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <a
              href={submitted.url}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonClasses({ variant: "whatsapp", size: "md" })}
            >
              <MessageCircle aria-hidden="true" className="size-4" />
              Open WhatsApp
            </a>
            <a
              href={`tel:${siteConfig.contact.phoneE164}`}
              className={buttonClasses({ variant: "outlineLight", size: "md" })}
            >
              <Phone aria-hidden="true" className="size-4" />
              Call instead
            </a>
          </div>

          <details className="mt-4">
            <summary className="cursor-pointer text-sm font-medium text-ink-900">
              See the message
            </summary>
            <pre className="mt-3 overflow-x-auto whitespace-pre-wrap rounded-xl border border-bone-200 bg-white p-4 text-xs leading-relaxed text-muted-light">
              {submitted.message}
            </pre>
          </details>
        </div>
      ) : null}
    </form>
  );
}
