import { MessageCircle, RotateCcw, SearchX } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { defaultFilters, hrefFor, type InventoryFilters } from "@/lib/inventory";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

/**
 * Shown when the filter combination matches nothing.
 *
 * Deliberately not a dead end: it explains what happened, offers the one action
 * that always works (clear everything), and gives the visitor a way to ask for
 * the car directly. Someone who has filtered themselves into a corner is a warm
 * lead, not a bounce.
 */
export function InventoryEmptyState({ filters }: { filters: InventoryFilters }) {
  const whatsappUrl = buildWhatsAppUrl(
    "Hello ZK Motors, I could not find what I was looking for on your website. Here is what I need:",
  );

  return (
    <div className="rounded-card border border-ink-800 bg-ink-900 px-6 py-16 text-center sm:px-10 sm:py-20">
      <div className="mx-auto grid size-14 place-items-center rounded-full border border-ink-700 bg-ink-850 text-ink-400">
        <SearchX aria-hidden="true" className="size-6" />
      </div>

      <h2 className="mt-6 text-2xl text-bone-50 sm:text-[1.75rem]">
        No cars match those filters
      </h2>

      <p className="mx-auto mt-3 max-w-md text-[0.9375rem] leading-relaxed text-muted-dark">
        Nothing in the current stock fits this combination. Try widening the
        price range or the model year — or tell us what you are after and we
        will look out for it.
      </p>

      <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
        <Button
          href={hrefFor({ ...defaultFilters, sort: filters.sort })}
          variant="primary"
          size="lg"
          className="w-full sm:w-auto"
        >
          <RotateCcw aria-hidden="true" className="size-4" />
          Clear all filters
        </Button>

        {whatsappUrl ? (
          <Button
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            variant="whatsapp"
            size="lg"
            className="w-full sm:w-auto"
          >
            <MessageCircle aria-hidden="true" className="size-4" />
            Tell us what you need
          </Button>
        ) : null}
      </div>
    </div>
  );
}
