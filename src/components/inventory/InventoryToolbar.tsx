"use client";

import { ChevronDown, SlidersHorizontal } from "lucide-react";
import { useRouter } from "next/navigation";
import { useId, useState } from "react";

import { MobileFilterSheet } from "@/components/inventory/MobileFilterSheet";
import { buttonClasses } from "@/components/ui/Button";
import {
  SORT_OPTIONS,
  countActiveFilters,
  hrefFor,
  type InventoryFilters,
  type SortKey,
} from "@/lib/inventory";
import { cn } from "@/lib/utils";
import type { Vehicle } from "@/types/vehicle";

/**
 * Results header: how many cars matched, the sort control, and the mobile
 * entry point into the filter sheet.
 *
 * Layout note: this bar is `sticky`, and it deliberately carries NO
 * `backdrop-blur`. The mobile sheet is rendered inside it, and any
 * backdrop-filter ancestor becomes the containing block for `position: fixed`
 * descendants — the sheet would be clipped to this bar instead of filling the
 * viewport. A solid background is correct here anyway: the page behind it is
 * the same colour.
 */
export function InventoryToolbar({
  filters,
  vehicles,
  resultCount,
  totalCount,
}: {
  filters: InventoryFilters;
  /* Passed straight through to the mobile filter sheet, which renders the same
     facet controls as the desktop sidebar. */
  vehicles: readonly Vehicle[];
  resultCount: number;
  totalCount: number;
}) {
  const router = useRouter();
  const sortId = useId();
  const [sheetOpen, setSheetOpen] = useState(false);
  const activeCount = countActiveFilters(filters);

  return (
    <>
      <div
        className={cn(
          "sticky top-nav z-30 mb-6 -mx-5 border-b border-ink-800 bg-ink-950 px-5 py-3",
          "sm:-mx-6 sm:px-6",
          "lg:mx-0 lg:px-0 lg:py-4",
        )}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          {/* Always reports the number, including zero. The empty state panel
              below does the explaining, so repeating "no matches" here would
              just say the same thing twice. */}
          <p aria-live="polite" className="text-sm text-muted-dark">
            Showing{" "}
            <span className="font-semibold text-bone-50">{resultCount}</span> of{" "}
            {totalCount} {totalCount === 1 ? "car" : "cars"}
          </p>

          <div className="flex items-center gap-3">
            <div className="flex min-w-0 flex-1 items-center gap-2 sm:flex-none">
              <label htmlFor={sortId} className="text-eyebrow shrink-0 text-ink-400">
                Sort
              </label>
              <div className="relative min-w-0 flex-1 sm:flex-none">
                <select
                  id={sortId}
                  value={filters.sort}
                  onChange={(event) =>
                    router.push(
                      hrefFor({ ...filters, sort: event.target.value as SortKey }),
                      { scroll: false },
                    )
                  }
                  className={cn(
                    "h-10 w-full cursor-pointer appearance-none rounded-full border border-ink-700",
                    "bg-ink-850 pl-3.5 pr-9 text-[0.8125rem] font-medium text-bone-50",
                    "transition-colors duration-200 hover:border-ink-500",
                    "sm:w-auto",
                  )}
                >
                  {SORT_OPTIONS.map((option) => (
                    <option
                      key={option.value}
                      value={option.value}
                      className="bg-ink-850 text-bone-50"
                    >
                      {option.label}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  aria-hidden="true"
                  className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-ink-400"
                />
              </div>
            </div>

            {/* Mobile-only: opens the filter sheet */}
            <button
              type="button"
              onClick={() => setSheetOpen(true)}
              aria-expanded={sheetOpen}
              aria-controls="inventory-filters"
              className={buttonClasses({
                variant: "outline",
                size: "md",
                className: "shrink-0 lg:hidden",
              })}
            >
              <SlidersHorizontal aria-hidden="true" className="size-4" />
              Filters
              {activeCount > 0 ? (
                <span className="ml-0.5 grid size-5 place-items-center rounded-full bg-accent-400 text-[0.6875rem] font-bold text-ink-950">
                  {activeCount}
                </span>
              ) : null}
            </button>
          </div>
        </div>
      </div>

      <MobileFilterSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        filters={filters}
        vehicles={vehicles}
        resultCount={resultCount}
      />
    </>
  );
}
