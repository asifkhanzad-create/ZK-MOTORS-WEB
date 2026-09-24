import { Clock, MapPin, Phone } from "lucide-react";

import { Container } from "@/components/ui/Container";
import { siteConfig } from "@/config/site";

/**
 * Compact utility strip above the header.
 * Deliberately quiet: small type, muted colour, no CTA competing with the hero.
 *
 * The strip is 56px so the phone link keeps a 44px tap target *and* has room for
 * its focus ring. Those two numbers are coupled, and it is worth writing down
 * why, because shrinking this back to `h-11` looks harmless and is not.
 *
 * The ring in globals.css is `2px` at `outline-offset: 3px`, so it is painted
 * 5px outside the link's border box — and this link is the first thing on the
 * page, so its ring has the top edge of the viewport immediately above it. At
 * `h-11` the link's `py-3` made it exactly 44px, filling the strip edge to edge:
 * zero clearance above, and the ring's top edge and both top corners were cut
 * off for every keyboard user on mobile. Confirmed by screenshot, not inferred.
 *
 * Clearance is `(strip − link) / 2`, so 5px needs the strip to be at least 10px
 * taller than the link. At 56px against a 44px link there is 6px — one pixel of
 * slack, so a small future change to the ring does not silently reintroduce
 * this. `qa/qa-focus-ring.mjs` asserts it across every page at two viewports.
 */
export function AnnouncementBar() {
  return (
    <div className="border-b border-ink-800 bg-ink-950">
      <Container>
        <div className="flex h-14 items-center justify-between gap-4 text-[0.75rem] text-muted-dark sm:text-[0.8125rem]">
          <p className="flex min-w-0 items-center gap-1.5">
            <MapPin aria-hidden="true" className="size-3.5 shrink-0 text-accent-500" />
            <span className="truncate">{siteConfig.basedIn}</span>
          </p>

          <p className="hidden items-center gap-1.5 md:flex">
            <Clock aria-hidden="true" className="size-3.5 shrink-0 text-accent-500" />
            <span>{siteConfig.hours.short}</span>
          </p>

          <a
            href={`tel:${siteConfig.contact.phoneE164}`}
            className="flex shrink-0 items-center gap-1.5 py-3 transition-colors duration-200 hover:text-bone-50"
          >
            <Phone aria-hidden="true" className="size-3.5 shrink-0 text-accent-500" />
            <span className="font-medium">{siteConfig.contact.phoneDisplay}</span>
          </a>
        </div>
      </Container>
    </div>
  );
}
