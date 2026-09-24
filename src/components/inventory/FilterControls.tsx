"use client";

import { ChevronDown, Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useState, type ReactNode } from "react";

import {
  STATUS_OPTIONS,
  getBodyTypes,
  getFuelTypes,
  getMakes,
  getModels,
  getPriceBounds,
  getRegistrationCities,
  getStatusCounts,
  getTransmissions,
  getYears,
  hrefFor,
  priceSteps,
  type ChipKey,
  type InventoryFilters,
} from "@/lib/inventory";
import { formatPKRShort } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Vehicle } from "@/types/vehicle";

/**
 * The filter form itself. Rendered twice on the /cars page — once in the
 * desktop sidebar and once inside the mobile sheet — so every control here is
 * self-contained and takes its state from props rather than from a shared
 * store.
 *
 * Every control writes to the URL. Nothing is held in React state, which means
 * the back button steps through filter changes, a filtered list is shareable,
 * and the server renders the result without a client round trip.
 *
 * Two control styles, chosen by how many options each group has:
 *   - Pills (links) for short, mutually exclusive sets. Links rather than
 *     buttons so they survive with JS disabled, can be middle-clicked, and
 *     give search engines a crawlable path into the filtered inventory.
 *   - Native selects for long sets (make, model, price, year). Native because
 *     keyboard handling and the mobile picker are better than anything custom.
 *
 * Filter links pass `scroll={false}`: the results toolbar is sticky, so the
 * updated count is already on screen and jumping the page would be jarring.
 */

/** A single-choice pill. `aria-current` is the correct signal for the active
 *  item within a set of links, and it is what screen readers announce. */
function Pill({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      scroll={false}
      prefetch={false}
      aria-current={active ? "true" : undefined}
      className={cn(
        "inline-flex min-h-9 items-center rounded-full border px-3.5",
        "text-[0.8125rem] font-medium transition-colors duration-200",
        active
          ? "border-accent-500 bg-accent-500/15 text-accent-200"
          : "border-ink-700 text-muted-dark hover:border-ink-500 hover:text-bone-50",
      )}
    >
      {children}
    </Link>
  );
}

function SelectField({
  id,
  label,
  value,
  onChange,
  children,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-eyebrow text-ink-400">
        {label}
      </label>
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={cn(
            "h-11 w-full cursor-pointer appearance-none rounded-xl border bg-ink-850",
            "pl-3.5 pr-10 text-sm text-bone-50",
            "transition-colors duration-200 hover:border-ink-500",
            value === "" ? "border-ink-700" : "border-accent-500 font-medium",
          )}
        >
          {children}
        </select>
        <ChevronDown
          aria-hidden="true"
          className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-400"
        />
      </div>
    </div>
  );
}

/** One labelled group of pills. */
function Group({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children: ReactNode;
}) {
  return (
    <div role="group" aria-labelledby={id}>
      <p id={id} className="text-eyebrow text-ink-400">
        {label}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

/* Native option elements are styled explicitly: a browser that honours the
   select's colour but not the option background would otherwise render light
   text on the system's white popup. Setting both keeps the two in step. */
const optionClass = "bg-ink-850 text-bone-50";

export function FilterControls({
  filters,
  vehicles,
}: {
  filters: InventoryFilters;
  /* The whole stock list, because every facet here — makes, models, years,
     cities, counts, price bounds — is derived from what is actually in stock.
     Fetched on the server and passed down; this component never fetches. */
  vehicles: readonly Vehicle[];
}) {
  const router = useRouter();
  const uid = useId();

  /* The keyword box is the one control that cannot commit on change, so it
     keeps local state and merges into the URL on submit. When the URL's `q`
     changes underneath us — the back button, or clearing the chip — the input
     is reset to match. Adjusting during render rather than in an effect is the
     documented pattern for "reset state when a prop changes"; an effect would
     render the stale value first and then re-render, which is a visible flash
     on a back navigation. */
  const [q, setQ] = useState(filters.q);
  const [syncedQ, setSyncedQ] = useState(filters.q);
  if (filters.q !== syncedQ) {
    setSyncedQ(filters.q);
    setQ(filters.q);
  }

  /* Everything below derives its href from this, so a half-typed keyword is
     carried along instead of being silently dropped by a facet click. */
  const live: InventoryFilters = { ...filters, q };

  const withFilter = (patch: Partial<InventoryFilters>) =>
    hrefFor({ ...live, ...patch });

  const clearGroup = (key: ChipKey) => hrefFor(live, key);

  const makes = getMakes(vehicles);
  const models = getModels(vehicles, filters.make || undefined);
  const years = getYears(vehicles);
  const statusCounts = getStatusCounts(vehicles);

  /* Bound the price ladder by the real stock so neither end can be set to a
     value that is guaranteed to return nothing. With no stock there is nothing
     to bound it with, so both ends fall back to the full ladder — an empty
     inventory is a temporary state, and a price filter with no options at all
     reads as broken rather than as empty. */
  const bounds = getPriceBounds(vehicles);
  const minPriceOptions = bounds
    ? priceSteps.filter((step) => step <= bounds.max)
    : priceSteps;
  const maxPriceOptions = bounds
    ? priceSteps.filter((step) => step >= bounds.min)
    : priceSteps;

  function onSearchSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    router.push(hrefFor(live), { scroll: false });
  }

  return (
    <div className="flex flex-col gap-6">
      {/* ------------------------------ Keyword ------------------------------ */}
      <form onSubmit={onSearchSubmit} className="flex flex-col gap-2">
        <label htmlFor={`${uid}-q`} className="text-eyebrow text-ink-400">
          Keyword
        </label>
        <div className="relative">
          <input
            id={`${uid}-q`}
            type="search"
            value={q}
            onChange={(event) => setQ(event.target.value)}
            placeholder="Corolla, Civic, SUV…"
            className={cn(
              "h-11 w-full rounded-xl border bg-ink-850 pl-3.5 pr-11",
              "text-sm text-bone-50 placeholder:text-ink-400",
              "transition-colors duration-200 hover:border-ink-500",
              q ? "border-accent-500 font-medium" : "border-ink-700",
            )}
          />
          <button
            type="submit"
            aria-label="Search by keyword"
            className="absolute right-1 top-1 grid size-9 cursor-pointer place-items-center rounded-lg text-ink-400 transition-colors duration-200 hover:bg-ink-800 hover:text-bone-50"
          >
            <Search aria-hidden="true" className="size-4" />
          </button>
        </div>
      </form>

      {/* ------------------------------- Make -------------------------------- */}
      <SelectField
        id={`${uid}-make`}
        label="Make"
        value={filters.make}
        /* Changing make invalidates the model, so it is cleared in the same
           navigation rather than left dangling. */
        onChange={(value) => router.push(withFilter({ make: value, model: "" }), { scroll: false })}
      >
        <option value="" className={optionClass}>
          Any make
        </option>
        {makes.map((make) => (
          <option key={make} value={make} className={optionClass}>
            {make}
          </option>
        ))}
      </SelectField>

      {/* ------------------------------- Model ------------------------------- */}
      <SelectField
        id={`${uid}-model`}
        label="Model"
        value={filters.model}
        onChange={(value) => router.push(withFilter({ model: value }), { scroll: false })}
      >
        <option value="" className={optionClass}>
          {filters.make ? `Any ${filters.make} model` : "Any model"}
        </option>
        {models.map((model) => (
          <option key={model} value={model} className={optionClass}>
            {model}
          </option>
        ))}
      </SelectField>

      {/* ------------------------------- Price ------------------------------- */}
      <div className="grid grid-cols-2 gap-3">
        <SelectField
          id={`${uid}-min-price`}
          label="Min price"
          value={filters.minPrice === null ? "" : String(filters.minPrice)}
          onChange={(value) =>
            router.push(
              withFilter({ minPrice: value ? Number(value) : null }),
              { scroll: false },
            )
          }
        >
          <option value="" className={optionClass}>
            Any
          </option>
          {minPriceOptions.map((step) => (
            <option key={step} value={step} className={optionClass}>
              {formatPKRShort(step)}
            </option>
          ))}
        </SelectField>

        <SelectField
          id={`${uid}-max-price`}
          label="Max price"
          value={filters.maxPrice === null ? "" : String(filters.maxPrice)}
          onChange={(value) =>
            router.push(
              withFilter({ maxPrice: value ? Number(value) : null }),
              { scroll: false },
            )
          }
        >
          <option value="" className={optionClass}>
            Any
          </option>
          {maxPriceOptions.map((step) => (
            <option key={step} value={step} className={optionClass}>
              {formatPKRShort(step)}
            </option>
          ))}
        </SelectField>
      </div>

      {/* -------------------------------- Year ------------------------------- */}
      <div className="grid grid-cols-2 gap-3">
        <SelectField
          id={`${uid}-min-year`}
          label="From year"
          value={filters.minYear === null ? "" : String(filters.minYear)}
          onChange={(value) =>
            router.push(
              withFilter({ minYear: value ? Number(value) : null }),
              { scroll: false },
            )
          }
        >
          <option value="" className={optionClass}>
            Any
          </option>
          {years.map((year) => (
            <option key={year} value={year} className={optionClass}>
              {year}
            </option>
          ))}
        </SelectField>

        <SelectField
          id={`${uid}-max-year`}
          label="To year"
          value={filters.maxYear === null ? "" : String(filters.maxYear)}
          onChange={(value) =>
            router.push(
              withFilter({ maxYear: value ? Number(value) : null }),
              { scroll: false },
            )
          }
        >
          <option value="" className={optionClass}>
            Any
          </option>
          {years.map((year) => (
            <option key={year} value={year} className={optionClass}>
              {year}
            </option>
          ))}
        </SelectField>
      </div>

      {/* --------------------------- Short sets ------------------------------ */}
      <Group id={`${uid}-transmission`} label="Transmission">
        <Pill href={clearGroup("transmission")} active={filters.transmission === ""}>
          Any
        </Pill>
        {getTransmissions(vehicles).map((item) => (
          <Pill
            key={item}
            href={withFilter({ transmission: item })}
            active={filters.transmission === item}
          >
            {item}
          </Pill>
        ))}
      </Group>

      <Group id={`${uid}-fuel`} label="Fuel">
        <Pill href={clearGroup("fuel")} active={filters.fuel === ""}>
          Any
        </Pill>
        {getFuelTypes(vehicles).map((item) => (
          <Pill key={item} href={withFilter({ fuel: item })} active={filters.fuel === item}>
            {item}
          </Pill>
        ))}
      </Group>

      <Group id={`${uid}-body`} label="Body type">
        <Pill href={clearGroup("bodyType")} active={filters.bodyType === ""}>
          Any
        </Pill>
        {getBodyTypes(vehicles).map((item) => (
          <Pill
            key={item}
            href={withFilter({ bodyType: item })}
            active={filters.bodyType === item}
          >
            {item}
          </Pill>
        ))}
      </Group>

      <Group id={`${uid}-city`} label="Registered in">
        <Pill href={clearGroup("city")} active={filters.city === ""}>
          Any
        </Pill>
        {getRegistrationCities(vehicles).map((item) => (
          <Pill key={item} href={withFilter({ city: item })} active={filters.city === item}>
            {item}
          </Pill>
        ))}
      </Group>

      {/* ------------------------------ Status -------------------------------
          Counts come from the stock itself, so the number beside each option is
          always true and the group can never offer an empty result. */}
      <Group id={`${uid}-status`} label="Show">
        {STATUS_OPTIONS.map((option) => {
          const count =
            option.value === "all"
              ? statusCounts.available + statusCounts.reserved + statusCounts.sold
              : option.value === "available"
                ? statusCounts.available + statusCounts.reserved
                : statusCounts.sold;

          return (
            <Pill
              key={option.value}
              href={withFilter({ status: option.value })}
              active={filters.status === option.value}
            >
              {option.label}
              <span className="ml-1.5 tabular-nums opacity-70">{count}</span>
            </Pill>
          );
        })}
      </Group>
    </div>
  );
}
