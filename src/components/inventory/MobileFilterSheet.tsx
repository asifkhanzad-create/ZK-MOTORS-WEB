"use client";

import { X } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef } from "react";

import { FilterControls } from "@/components/inventory/FilterControls";
import { buttonClasses } from "@/components/ui/Button";
import { defaultFilters, hrefFor, type InventoryFilters } from "@/lib/inventory";
import { cn } from "@/lib/utils";

/**
 * Filter panel as a slide-over on small screens.
 *
 * Same structure as MobileNav, and for the same reason: the panel is absolutely
 * positioned inside a fixed, viewport-sized `overflow-hidden` wrapper. A fixed
 * panel translated off-screen would otherwise extend the document's scroll
 * width and give the whole page a horizontal scrollbar.
 *
 * Every control inside writes straight to the URL, so filters apply live and
 * the result count in the footer updates as the visitor taps. The footer button
 * therefore only has to close the sheet.
 */
export function MobileFilterSheet({
  open,
  onClose,
  filters,
  resultCount,
}: {
  open: boolean;
  onClose: () => void;
  filters: InventoryFilters;
  resultCount: number;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);

  /* Escape closes */
  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  /* Lock background scroll while the sheet is open */
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  /* Move focus into the sheet */
  useEffect(() => {
    if (open) closeRef.current?.focus();
  }, [open]);

  return (
    <div
      className={cn(
        "fixed inset-0 z-[70] overflow-hidden lg:hidden",
        open ? "pointer-events-auto" : "pointer-events-none",
      )}
      aria-hidden={!open}
      inert={!open}
    >
      <div
        onClick={onClose}
        className={cn(
          "absolute inset-0 bg-ink-950/70 backdrop-blur-sm transition-opacity duration-300",
          open ? "opacity-100" : "opacity-0",
        )}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Filter vehicles"
        id="inventory-filters"
        className={cn(
          "absolute inset-y-0 right-0 z-10 flex w-[min(24rem,92vw)] flex-col",
          "border-l border-ink-800 bg-ink-900 shadow-2xl",
          "transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
          open ? "translate-x-0" : "translate-x-full",
        )}
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-ink-800 px-5">
          <span className="font-display text-base font-bold text-bone-50">
            Filters
          </span>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close filters"
            className="grid size-11 cursor-pointer place-items-center rounded-full text-bone-100 transition-colors duration-200 hover:bg-ink-800"
          >
            <X aria-hidden="true" className="size-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-6">
          <FilterControls filters={filters} />
        </div>

        <div className="flex shrink-0 items-center gap-3 border-t border-ink-800 bg-ink-900 px-5 py-4">
          <Link
            href={hrefFor({ ...defaultFilters, sort: filters.sort })}
            scroll={false}
            prefetch={false}
            onClick={onClose}
            className={buttonClasses({
              variant: "outline",
              size: "lg",
              className: "shrink-0",
            })}
          >
            Clear all
          </Link>

          <button
            type="button"
            onClick={onClose}
            className={buttonClasses({
              variant: "primary",
              size: "lg",
              className: "flex-1",
            })}
          >
            {resultCount === 1 ? "Show 1 car" : `Show ${resultCount} cars`}
          </button>
        </div>
      </div>
    </div>
  );
}
