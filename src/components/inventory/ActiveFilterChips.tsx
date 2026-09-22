import { RotateCcw, X } from "lucide-react";
import Link from "next/link";

import {
  activeChips,
  defaultFilters,
  hrefFor,
  type InventoryFilters,
} from "@/lib/inventory";

/**
 * The "what am I actually looking at" row.
 *
 * Each chip is a link that clears just its own group, which is why the price
 * and year ranges collapse to one chip each — clearing half a range is never
 * what someone wants. A server component: the hrefs are pure functions of the
 * filters, so there is nothing here that needs the client.
 */
export function ActiveFilterChips({ filters }: { filters: InventoryFilters }) {
  const chips = activeChips(filters);
  if (chips.length === 0) return null;

  return (
    <div className="mb-6 flex flex-wrap items-center gap-2">
      <span className="text-eyebrow text-ink-400">Filtered by</span>

      {chips.map((chip) => (
        <Link
          key={chip.key}
          href={chip.clearHref}
          scroll={false}
          prefetch={false}
          aria-label={`Remove filter: ${chip.label}`}
          className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-ink-700 bg-ink-850 pl-3.5 pr-2.5 text-[0.8125rem] font-medium text-bone-100 transition-colors duration-200 hover:border-ink-500 hover:text-bone-50"
        >
          {chip.label}
          <X aria-hidden="true" className="size-3.5 text-ink-400" />
        </Link>
      ))}

      {chips.length > 1 ? (
        <Link
          href={hrefFor({ ...defaultFilters, sort: filters.sort })}
          scroll={false}
          prefetch={false}
          className="inline-flex min-h-9 items-center gap-1.5 rounded-full px-3 text-[0.8125rem] font-medium text-muted-dark transition-colors duration-200 hover:text-bone-50"
        >
          <RotateCcw aria-hidden="true" className="size-3.5" />
          Clear all
        </Link>
      ) : null}
    </div>
  );
}
