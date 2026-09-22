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
import { vehicles } from "@/data/vehicles";
import { formatPKR, vehicleTitle } from "@/lib/format";
import { defaultFilters, parseFilters, selectVehicles } from "@/lib/inventory";
import { AVAILABILITY } from "@/lib/vehicle";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

const title = "Used Cars for Sale in Wah Cantt & Taxila";
const description =
  "Browse the full ZK Motors inventory of used cars in Wah Cantt and Taxila. Filter by make, budget, model year, transmission and body type, with mileage and asking price on every listing.";

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
        alt: "ZK Motors — used cars in Wah Cantt and Taxila",
      },
    ],
  },
};

/**
 * Inventory page.
 *
 * A server component throughout: the filter state lives in the URL, so the
 * server can do the filtering and render the finished list. No client-side
 * fetch, no loading state, no hydration mismatch — and the browser back button
 * walks back through filter changes for free.
 */
export default async function CarsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const raw = await searchParams;
  const filters = parseFilters(raw);
  const results = selectVehicles(filters);

  const totalCount = vehicles.length;

  /* The headline figures describe buyable stock, not the raw row count.
     `totalCount` includes the four sold cars, so labelling it "in stock" would
     be wrong by four. Derived from the default filter set so these numbers and
     the default view can never disagree. */
  const buyable = selectVehicles(defaultFilters);
  const inStockCount = buyable.length;
  const lowestPrice = Math.min(...buyable.map((vehicle) => vehicle.price));

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
        image: `${siteUrl}${vehicle.image}`,
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
              <div>
                <dt className="text-eyebrow text-ink-400">From</dt>
                <dd className="mt-1.5 font-display text-2xl font-bold text-bone-50">
                  {formatPKR(lowestPrice)}
                </dd>
              </div>
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
              {/* One rem of breathing room below the sticky header — see the
                  --spacing-nav note in globals.css. */}
              <div className="sticky top-[calc(var(--spacing-nav)+1rem)] max-h-[calc(100dvh-8rem)] overflow-y-auto overscroll-contain pb-4 pr-1">
                <h2 className="mb-5 text-eyebrow text-ink-400">Refine</h2>
                <FilterControls filters={filters} />
              </div>
            </aside>

            <div className="min-w-0">
              <InventoryToolbar
                filters={filters}
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
