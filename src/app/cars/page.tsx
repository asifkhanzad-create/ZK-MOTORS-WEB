import { ChevronRight, MessageCircle, Phone } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { ActiveFilterChips } from "@/components/inventory/ActiveFilterChips";
import { FilterControls } from "@/components/inventory/FilterControls";
import { InventoryEmptyState } from "@/components/inventory/InventoryEmptyState";
import { InventoryToolbar } from "@/components/inventory/InventoryToolbar";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { PageTransition } from "@/components/ui/PageTransition";
import { VehicleCard } from "@/components/ui/VehicleCard";
import { siteConfig, siteUrl } from "@/config/site";
import { absoluteImageUrl, formatPKR, vehicleTitle } from "@/lib/format";
import { defaultFilters, parseFilters, selectVehicles } from "@/lib/inventory";
import { AVAILABILITY } from "@/lib/vehicle";
import { fetchVehicles } from "@/lib/vehicles-source";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import type { Vehicle } from "@/types/vehicle";

const title = "Used Cars for Sale in Wah Cantt";
const description =
  "Browse the full ZK Motors inventory of used cars. Filter by make, budget, model year, transmission and body type, with mileage and asking price on every listing.";

export const metadata: Metadata = {
  title,
  description,
  /* Every filtered permutation canonicalises to the unfiltered inventory.
     Filter URLs are useful to a visitor but are duplicate content to a search
     engine, and there is no crawl budget worth spending on `?make=Toyota`. */
  alternates: { canonical: "/cars" },
  openGraph: {
    type: "website",
    locale: "en_PK",
    url: `${siteUrl}/cars`,
    siteName: siteConfig.name,
    title: `${title} | ${siteConfig.name}`,
    description,
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "ZK Motors — used cars in Wah Cantt",
      },
    ],
  },
};

/**
 * Shown when the inventory cannot be read.
 *
 * A distinct state from "no cars match your filters", because the two mean
 * opposite things and the visitor's next action differs. It deliberately does
 * **not** fall back to the placeholder array: presenting invented cars as real
 * stock would be worse than presenting none, and nothing on the page would tell
 * the visitor which they were looking at.
 *
 * The phone and WhatsApp buttons are the point of this state — for a dealership
 * the call is the conversion, so an outage should still route to it.
 */
function InventoryUnavailable() {
  const whatsappUrl = buildWhatsAppUrl(
    "Hello ZK Motors, your website could not show the car list. Could you tell me what is available?",
  );

  return (
    <PageTransition>
      <section className="bg-ink-950 pb-20 pt-16 sm:pb-24 sm:pt-20">
        <Container>
          <div className="mx-auto flex max-w-2xl flex-col items-start gap-5">
            <p className="text-eyebrow text-accent-300">Temporarily unavailable</p>
            <h1 className="text-3xl text-bone-50 sm:text-4xl">
              We could not load the car list
            </h1>
            <p className="text-[0.9375rem] leading-relaxed text-muted-dark sm:text-base">
              This is a problem at our end, not with your connection — the
              inventory is not reachable right now. Please call or message us and
              we will tell you what is in stock.
            </p>

            <div className="mt-2 flex flex-col gap-3 sm:flex-row">
              <Button
                href={`tel:${siteConfig.contact.phoneE164}`}
                variant="primary"
                size="lg"
              >
                <Phone aria-hidden="true" className="size-4" />
                Call {siteConfig.contact.phoneDisplay}
              </Button>

              {whatsappUrl ? (
                <Button
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="whatsapp"
                  size="lg"
                >
                  <MessageCircle aria-hidden="true" className="size-5" />
                  WhatsApp
                </Button>
              ) : null}
            </div>

            <p className="text-sm text-ink-400">
              Or{" "}
              <Link href="/" className="underline underline-offset-2 hover:text-bone-100">
                go back to the homepage
              </Link>
              .
            </p>
          </div>
        </Container>
      </section>
    </PageTransition>
  );
}

/**
 * Inventory page.
 *
 * A server component throughout: the filter state lives in the URL, so the
 * server can do the filtering and render the finished list. No client-side
 * fetch, no loading state, no hydration mismatch — and the browser back button
 * walks back through filter changes for free.
 *
 * This route is dynamic rather than prerendered, because it awaits
 * `searchParams`. That is why a database read here costs nothing: there is no
 * build-time snapshot to go stale.
 */
export default async function CarsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const raw = await searchParams;

  /* Read once, then used for everything below — validating the URL against the
     facets that actually exist, filtering, and the counts in the header. */
  let stock: Vehicle[];
  try {
    stock = await fetchVehicles();
  } catch (error) {
    console.error("[cars] inventory unavailable:", error);
    return <InventoryUnavailable />;
  }

  const filters = parseFilters(raw, stock);
  const results = selectVehicles(filters, stock);

  const totalCount = stock.length;

  /* The headline figures describe buyable stock, not the raw row count.
     `totalCount` includes the sold cars, so labelling it "in stock" would be
     wrong. Derived from the default filter set so these numbers and the default
     view can never disagree. */
  const buyable = selectVehicles(defaultFilters, stock);
  const inStockCount = buyable.length;
  /* `Math.min()` of an empty list is Infinity, which `formatPKR` would happily
     render as "PKR Infinity". Null means "omit the figure". */
  const lowestPrice =
    buyable.length > 0 ? Math.min(...buyable.map((vehicle) => vehicle.price)) : null;

  const whatsappUrl = buildWhatsAppUrl();

  /* Describes the current result set, not the whole catalogue, so it stays
     truthful when the list is filtered. */
  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${title} — ${siteConfig.name}`,
    numberOfItems: results.length,
    itemListElement: results.map((vehicle, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "Car",
        name: vehicleTitle(vehicle),
        vehicleModelDate: String(vehicle.year),
        bodyType: vehicle.bodyType,
        vehicleTransmission: vehicle.transmission,
        fuelType: vehicle.fuel,
        mileageFromOdometer: {
          "@type": "QuantitativeValue",
          value: vehicle.mileage,
          unitCode: "KMT",
        },
        image: absoluteImageUrl(vehicle.image, siteUrl),
        offers: {
          "@type": "Offer",
          price: vehicle.price,
          priceCurrency: "PKR",
          availability: AVAILABILITY[vehicle.status],
        },
      },
    })),
  };

  return (
    <PageTransition>
      {/* ------------------------------ Page head ------------------------------ */}
      <section className="border-b border-ink-800 bg-ink-950 py-10 sm:py-12">
        <Container>
          <nav aria-label="Breadcrumb">
            <ol className="flex items-center gap-1.5 text-[0.8125rem] text-muted-dark">
              <li>
                <Link
                  href="/"
                  className="rounded transition-colors duration-200 hover:text-bone-50"
                >
                  Home
                </Link>
              </li>
              <ChevronRight aria-hidden="true" className="size-3.5 text-ink-500" />
              <li>
                <span aria-current="page" className="text-bone-100">
                  Cars
                </span>
              </li>
            </ol>
          </nav>

          <div className="mt-6 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between lg:gap-12">
            <div className="flex flex-col gap-3">
              <h1 className="text-3xl text-bone-50 sm:text-4xl lg:text-[2.75rem]">
                Cars in stock
              </h1>
              <p className="max-w-2xl text-[0.9375rem] leading-relaxed text-muted-dark sm:text-base">
                Every car currently with us in Wah Cantt. Each listing shows the
                model year, mileage, transmission and asking price up front, so
                you can rule cars in or out before you call.
              </p>
            </div>

            {/* The cheapest thing in stock is the single most useful number on
                an inventory page, so it gets a place in the header. Full price
                rather than the short "lakh" form: this is a headline figure and
                it should match the price printed on the cards. */}
            <dl className="flex shrink-0 gap-8 border-t border-ink-800 pt-5 lg:border-l lg:border-t-0 lg:pl-10 lg:pt-0">
              <div>
                <dt className="text-eyebrow text-ink-400">Available now</dt>
                <dd className="mt-1.5 font-display text-2xl font-bold text-bone-50">
                  {inStockCount}
                </dd>
              </div>
              {/* Omitted rather than shown as "PKR Infinity" when nothing is
                  buyable — an empty lot is a real state, not an error. */}
              {lowestPrice !== null ? (
                <div>
                  <dt className="text-eyebrow text-ink-400">From</dt>
                  <dd className="mt-1.5 font-display text-2xl font-bold text-bone-50">
                    {formatPKR(lowestPrice)}
                  </dd>
                </div>
              ) : null}
            </dl>
          </div>
        </Container>
      </section>

      {/* ---------------------------- Filters + results ----------------------- */}
      <section className="bg-ink-950 pb-16 pt-8 sm:pb-20">
        <Container>
          <div className="lg:grid lg:grid-cols-[17rem_1fr] lg:gap-10">
            {/* Desktop sidebar. The mobile equivalent is the sheet in the
                toolbar, which is why this is hidden below lg rather than
                collapsed. */}
            <aside aria-label="Filter cars" className="hidden lg:block">
              {/* The negative margin and matching padding are load-bearing, not
                  tidying, and the numbers are measured rather than guessed.

                  `overflow-y-auto` forces `overflow-x` to compute to `auto` as
                  well, so this wrapper clips horizontally. The focus ring in
                  globals.css is `2px` at `outline-offset: 3px` — 5px *outside*
                  the control's border box — so it needs 5px of room on every side
                  or it is cut.

                  Clearing the padding box is NOT enough on the right, because of
                  the scrollbar. On Windows, Edge/Chrome draw an *overlay*
                  scrollbar: it takes zero layout space (`offsetWidth` minus
                  `clientWidth` is 0) and floats over the last 15px of the
                  scrollport. Padding the content 8px clear of the padding box
                  still left the ring 12px *inside* the scrollbar.

                  `scrollbar-gutter: stable` is the fix for that, and it does two
                  things: it reserves the gutter so the scrollbar stops overlaying
                  content, and it makes the layout identical whether the machine
                  uses overlay or classic scrollbars. Without it the filter column
                  is 272px on one machine and 257px on the next.

                  `-mx-4 px-4` then gives 11px on both sides — the gap is
                  `padding − 5px ring reach`, and the same 16px also cancels the
                  gutter so the left edge stays flush with the grid column. The
                  controls end 15px short of the column's right edge; that 15px
                  belongs to the scrollbar. `qa/qa-focus-ring.mjs` asserts the
                  clearance, measured against the scrollbar, not the padding box. */}
              <div className="sticky top-[calc(var(--spacing-nav)+1rem)] -mx-4 max-h-[calc(100dvh-8rem)] overflow-y-auto overscroll-contain px-4 pb-4 [scrollbar-gutter:stable]">
                <h2 className="mb-5 text-eyebrow text-ink-400">Refine</h2>
                <FilterControls filters={filters} vehicles={stock} />
              </div>
            </aside>

            <div className="min-w-0">
              <InventoryToolbar
                filters={filters}
                vehicles={stock}
                resultCount={results.length}
                totalCount={totalCount}
              />

              <ActiveFilterChips filters={filters} />

              {results.length === 0 ? (
                <InventoryEmptyState filters={filters} />
              ) : (
                /* No scroll-reveal animation here on purpose: this grid is
                   re-rendered on every filter change, and fading the results in
                   each time reads as flicker rather than polish. */
                <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                  {results.map((vehicle) => (
                    <li key={vehicle.id}>
                      <VehicleCard vehicle={vehicle} />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </Container>
      </section>

      {/* -------------------------------- CTA --------------------------------
          A light band to close the page. The inventory itself is dark so the
          photography carries it, but an unbroken dark scroll for the whole page
          would be heavy — this also echoes the light search band on the
          homepage. */}
      <section className="border-t border-bone-200 bg-bone-50 py-16 sm:py-20">
        <Container>
          <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between lg:gap-16">
            <div className="flex flex-col gap-3">
              <h2 className="text-2xl text-ink-950 sm:text-3xl">
                Looking for something specific?
              </h2>
              <p className="max-w-xl text-[0.9375rem] leading-relaxed text-muted-light sm:text-base">
                Tell us the make, model and budget you have in mind. If it is not
                on the lot today, we will get in touch when something suitable
                comes in.
              </p>
            </div>

            <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
              {/* Signal red, not the neutral outline: this is the selling path,
                  and red is what the rest of the site uses to mark it. Matches
                  the Sell/Exchange CTA on the homepage. */}
              <Button href="/sell-your-car" variant="primarySignal" size="lg">
                Sell or exchange yours
              </Button>

              <Button
                href={`tel:${siteConfig.contact.phoneE164}`}
                variant="outlineLight"
                size="lg"
              >
                <Phone aria-hidden="true" className="size-4" />
                Call the showroom
              </Button>

              {whatsappUrl ? (
                <Button
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="whatsapp"
                  size="lg"
                >
                  <MessageCircle aria-hidden="true" className="size-5" />
                  WhatsApp
                </Button>
              ) : null}
            </div>
          </div>
        </Container>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemList) }}
      />
    </PageTransition>
  );
}
