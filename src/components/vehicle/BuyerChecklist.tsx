import { Check } from "lucide-react";

import { siteConfig } from "@/config/site";
import { vehicleTitle } from "@/lib/format";
import type { Vehicle } from "@/types/vehicle";

/**
 * The things a buyer should ask about that this website cannot answer.
 *
 * Written as questions, never as assurances. The site has not inspected these
 * cars, and a detail page is exactly where an invented "full service history"
 * would do the most damage — so the page tells the visitor what to ask instead
 * of implying we already know.
 *
 * This lives in the main column rather than in the sticky enquiry panel for a
 * measurable reason: with it inside the panel, the panel rendered 787px tall
 * and did not fit a 768px-tall laptop viewport, which meant `position: sticky`
 * pinned its top and left the bottom of the checklist permanently off screen.
 * `qa/qa-detail.mjs` measures the panel height against the viewport, so this
 * cannot regress silently.
 */
export function BuyerChecklist({ vehicle }: { vehicle: Vehicle }) {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-xl text-bone-50 sm:text-2xl">Ask us before you visit</h2>
      <p className="max-w-2xl text-[0.9375rem] leading-relaxed text-muted-dark sm:text-base">
        We will answer any of these over the phone or on WhatsApp — for the{" "}
        {vehicleTitle(vehicle)} or any other car — so you know whether the trip
        is worth making.
      </p>
      <ul className="grid grid-cols-1 gap-x-8 gap-y-2.5 sm:grid-cols-2">
        {siteConfig.buyerChecklist.map((item) => (
          <li
            key={item}
            className="flex items-start gap-2.5 text-[0.9375rem] leading-relaxed text-bone-200"
          >
            <Check
              aria-hidden="true"
              className="mt-1 size-4 shrink-0 text-accent-400"
            />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
