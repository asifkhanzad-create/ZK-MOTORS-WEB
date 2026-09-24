"use client";

import { ChevronDown, RotateCcw, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useId, useMemo, useState, type ReactNode } from "react";

import { buttonClasses } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { getMakes, getModels, getYears, transmissions } from "@/lib/facets";
import { formatPKRShort } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Vehicle } from "@/types/vehicle";

const ANY = "";

const priceOptions = [
  2_000_000, 3_000_000, 4_000_000, 5_000_000, 6_000_000, 8_000_000, 10_000_000,
  15_000_000, 20_000_000, 30_000_000,
];

/** Labelled native select — keeps keyboard and mobile behaviour native. */
function Field({
  label,
  value,
  onChange,
  children,
  id,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
  id: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor={id}
        className="text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-muted-light"
      >
        {label}
      </label>
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={cn(
            "h-12 w-full cursor-pointer appearance-none rounded-xl border bg-white",
            "pl-3.5 pr-10 text-[0.9375rem] text-ink-900",
            "transition-colors duration-200",
            value === ANY
              ? "border-bone-300"
              : "border-accent-500 bg-accent-500/6 font-medium",
            "hover:border-ink-400/60",
          )}
        >
          {children}
        </select>
        <ChevronDown
          aria-hidden="true"
          className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-light"
        />
      </div>
    </div>
  );
}

export function QuickSearch({ vehicles }: { vehicles: readonly Vehicle[] }) {
  const router = useRouter();
  const uid = useId();

  const [make, setMake] = useState(ANY);
  const [model, setModel] = useState(ANY);
  const [minPrice, setMinPrice] = useState(ANY);
  const [maxPrice, setMaxPrice] = useState(ANY);
  const [year, setYear] = useState(ANY);
  const [transmission, setTransmission] = useState(ANY);

  const makes = useMemo(() => getMakes(vehicles), [vehicles]);
  const models = useMemo(
    () => getModels(vehicles, make || undefined),
    [vehicles, make],
  );
  const years = useMemo(() => getYears(vehicles), [vehicles]);

  const hasFilters =
    make || model || minPrice || maxPrice || year || transmission;

  /* Live feedback against the real inventory, counted in the browser so the
     visitor sees the effect of each choice before committing to a search. The
     list is small enough that filtering it here costs nothing, and it avoids a
     round trip per keystroke. */
  const matchCount = useMemo(() => {
    return vehicles.filter((vehicle) => {
      if (make && vehicle.make !== make) return false;
      if (model && vehicle.model !== model) return false;
      if (year && vehicle.year !== Number(year)) return false;
      if (transmission && vehicle.transmission !== transmission) return false;
      if (minPrice && vehicle.price < Number(minPrice)) return false;
      if (maxPrice && vehicle.price > Number(maxPrice)) return false;
      return true;
    }).length;
  }, [vehicles, make, model, minPrice, maxPrice, year, transmission]);

  function reset() {
    setMake(ANY);
    setModel(ANY);
    setMinPrice(ANY);
    setMaxPrice(ANY);
    setYear(ANY);
    setTransmission(ANY);
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    // Phase 2 will own /cars. The query string is already in its final shape.
    const params = new URLSearchParams();
    if (make) params.set("make", make);
    if (model) params.set("model", model);
    if (minPrice) params.set("minPrice", minPrice);
    if (maxPrice) params.set("maxPrice", maxPrice);
    if (year) params.set("year", year);
    if (transmission) params.set("transmission", transmission);

    const query = params.toString();
    router.push(query ? `/cars?${query}` : "/cars");
  }

  return (
    <section className="border-b border-bone-200 bg-bone-50 py-12 sm:py-14">
      <Container>
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex flex-col gap-2">
              <h2 className="text-2xl text-ink-950 sm:text-3xl">
                Find the right car faster
              </h2>
              <p className="text-[0.9375rem] text-muted-light">
                Narrow the list by make, budget, year and transmission.
              </p>
            </div>
            {hasFilters ? (
              <button
                type="button"
                onClick={reset}
                className="inline-flex w-fit cursor-pointer items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-muted-light transition-colors duration-200 hover:bg-ink-950/5 hover:text-ink-900"
              >
                <RotateCcw aria-hidden="true" className="size-3.5" />
                Reset filters
              </button>
            ) : null}
          </div>

          <form
            onSubmit={onSubmit}
            className="rounded-card border border-bone-200 bg-white p-5 shadow-[0_18px_40px_-28px_rgba(10,11,13,0.35)] sm:p-6"
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">
              <Field
                id={`${uid}-make`}
                label="Make"
                value={make}
                onChange={(value) => {
                  setMake(value);
                  setModel(ANY);
                }}
              >
                <option value={ANY}>Any make</option>
                {makes.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </Field>

              <Field
                id={`${uid}-model`}
                label="Model"
                value={model}
                onChange={setModel}
              >
                <option value={ANY}>Any model</option>
                {models.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </Field>

              <Field
                id={`${uid}-min`}
                label="Min price"
                value={minPrice}
                onChange={setMinPrice}
              >
                <option value={ANY}>No minimum</option>
                {priceOptions.map((item) => (
                  <option key={item} value={String(item)}>
                    {formatPKRShort(item)}
                  </option>
                ))}
              </Field>

              <Field
                id={`${uid}-max`}
                label="Max price"
                value={maxPrice}
                onChange={setMaxPrice}
              >
                <option value={ANY}>No maximum</option>
                {priceOptions.map((item) => (
                  <option key={item} value={String(item)}>
                    {formatPKRShort(item)}
                  </option>
                ))}
              </Field>

              <Field
                id={`${uid}-year`}
                label="Model year"
                value={year}
                onChange={setYear}
              >
                <option value={ANY}>Any year</option>
                {years.map((item) => (
                  <option key={item} value={String(item)}>
                    {item}
                  </option>
                ))}
              </Field>

              <Field
                id={`${uid}-transmission`}
                label="Transmission"
                value={transmission}
                onChange={setTransmission}
              >
                <option value={ANY}>Any</option>
                {transmissions.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </Field>
            </div>

            <div className="mt-5 flex flex-col gap-4 border-t border-bone-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
              {/* aria-live so screen readers hear the count change */}
              <p
                aria-live="polite"
                className="text-sm text-muted-light"
              >
                {matchCount > 0 ? (
                  <>
                    <span className="font-semibold text-ink-900">
                      {matchCount}
                    </span>{" "}
                    {matchCount === 1 ? "vehicle matches" : "vehicles match"} your
                    filters
                  </>
                ) : (
                  <span className="text-ink-900">
                    No vehicles match yet — try widening your search.
                  </span>
                )}
              </p>

              <button
                type="submit"
                className={buttonClasses({
                  variant: "primary",
                  size: "lg",
                  className: "w-full sm:w-auto",
                })}
              >
                <Search aria-hidden="true" className="size-4" />
                Search cars
              </button>
            </div>
          </form>
        </div>
      </Container>
    </section>
  );
}
