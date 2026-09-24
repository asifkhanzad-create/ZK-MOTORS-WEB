import { ChevronRight, Info, MessageCircle } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { PageTransition } from "@/components/ui/PageTransition";
import { BuyerChecklist } from "@/components/vehicle/BuyerChecklist";
import { EnquiryPanel } from "@/components/vehicle/EnquiryPanel";
import { SimilarVehicles } from "@/components/vehicle/SimilarVehicles";
import { SpecTable } from "@/components/vehicle/SpecTable";
import { VehicleGallery } from "@/components/vehicle/VehicleGallery";
import { inventoryIsPlaceholder, siteConfig, siteUrl } from "@/config/site";
import { getSimilarVehicles, getVehicleById } from "@/lib/facets";
import { absoluteImageUrl, formatMileage, vehicleTitle } from "@/lib/format";
import { AVAILABILITY, vehicleDescription, vehicleFullTitle } from "@/lib/vehicle";
import { fetchVehicles } from "@/lib/vehicles-source";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

type Params = { params: Promise<{ id: string }> };

/**
 * Every vehicle detail page is prerendered at build time.
 *
 * `dynamicParams` is deliberately left at its default (true) rather than set to
 * false. Setting it false makes Next serve its own static 404 for an unmatched
 * segment — which is faster, but it produced a **React hydration mismatch**
 * (minified error #418) on `/cars/{unknown}` in the production build: the
 * server sent the 404 document while the client router hydrated the `[id]`
 * tree. It did not reproduce in `next dev`, which is why it is worth stating
 * here rather than rediscovering it.
 *
 * With the default, an unknown slug renders on demand, `getVehicleById`
 * returns undefined, and `notFound()` renders the not-found page through the
 * supported path — no mismatch. `qa/qa-detail.mjs` asserts both that an
 * unknown slug returns 404 and that no uncaught page error occurs.
 *
 * Each detail page revalidates every five minutes, so a car marked sold in the
 * database stops advertising itself without waiting for a deploy. The Phase 6
 * admin dashboard calls `revalidatePath()` for an immediate update; this window
 * is the backstop for edits made directly in Supabase.
 */
export const revalidate = 300;

export async function generateStaticParams() {
  const vehicles = await fetchVehicles();
  return vehicles.map((vehicle) => ({ id: vehicle.id }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const vehicle = getVehicleById(await fetchVehicles(), id);

  if (!vehicle) {
    return { title: "Car not found", robots: { index: false, follow: true } };
  }

  const title = `${vehicleFullTitle(vehicle)} for Sale`;
  /* Built from the record, so the description can never claim a specification
     the listing does not actually have. */
  const description =
    `${vehicleFullTitle(vehicle)} for sale at ${siteConfig.name} in ` +
    `${siteConfig.basedIn}. ${formatMileage(vehicle.mileage)}, ` +
    `${vehicle.transmission.toLowerCase()}, ${vehicle.fuel.toLowerCase()}, ` +
    `registered in ${vehicle.registrationCity}. Call or WhatsApp for details.`;

  return {
    title,
    description,
    alternates: { canonical: `/cars/${vehicle.id}` },
    openGraph: {
      type: "website",
      locale: "en_PK",
      url: `${siteUrl}/cars/${vehicle.id}`,
      siteName: siteConfig.name,
      title: `${title} | ${siteConfig.name}`,
      description,
      /* The car's own photo, not the site OG image: a shared listing should
         preview the actual vehicle. */
      images: [
        {
          url: absoluteImageUrl(vehicle.image, siteUrl),
          width: 1200,
          height: 900,
          alt: vehicle.imageAlt,
        },
      ],
    },
  };
}

export default async function VehicleDetailPage({ params }: Params) {
  const { id } = await params;

  /* One read for the whole page: the car itself, and the pool that similar
     vehicles are scored against. `fetchVehicles` is memoised per request, so
     this is the same query `generateMetadata` already made rather than a second
     round trip. */
  const vehicles = await fetchVehicles();
  const vehicle = getVehicleById(vehicles, id);

  if (!vehicle) notFound();

  const title = vehicleTitle(vehicle);
  const isSold = vehicle.status === "sold";
  const similar = getSimilarVehicles(vehicles, vehicle);
  const whatsappUrl = buildWhatsAppUrl();

  const carSchema = {
    "@context": "https://schema.org",
    "@type": "Car",
    name: title,
    description: vehicleDescription(vehicle),
    url: `${siteUrl}/cars/${vehicle.id}`,
    image: absoluteImageUrl(vehicle.image, siteUrl),
    brand: { "@type": "Brand", name: vehicle.make },
    model: vehicle.model,
    vehicleModelDate: String(vehicle.year),
    bodyType: vehicle.bodyType,
    vehicleTransmission: vehicle.transmission,
    fuelType: vehicle.fuel,
    mileageFromOdometer: {
      "@type": "QuantitativeValue",
      value: vehicle.mileage,
      unitCode: "KMT",
    },
    offers: {
      "@type": "Offer",
      price: vehicle.price,
      priceCurrency: "PKR",
      availability: AVAILABILITY[vehicle.status],
      url: `${siteUrl}/cars/${vehicle.id}`,
      seller: {
        "@type": "AutoDealer",
        name: siteConfig.name,
        telephone: siteConfig.contact.phoneE164,
      },
    },
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
      { "@type": "ListItem", position: 2, name: "Cars", item: `${siteUrl}/cars` },
      {
        "@type": "ListItem",
        position: 3,
        name: title,
        item: `${siteUrl}/cars/${vehicle.id}`,
      },
    ],
  };

  return (
    <PageTransition>
      <section className="bg-ink-950 pb-14 pt-8 sm:pb-16">
        <Container>
          <nav aria-label="Breadcrumb">
            <ol className="flex flex-wrap items-center gap-1.5 text-[0.8125rem] text-muted-dark">
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
                <Link
                  href="/cars"
                  className="rounded transition-colors duration-200 hover:text-bone-50"
                >
                  Cars
                </Link>
              </li>
              <ChevronRight aria-hidden="true" className="size-3.5 text-ink-500" />
              <li>
                {/* The last crumb is long, so it truncates rather than wrapping
                    the whole row onto a second line on a phone. */}
                <span aria-current="page" className="block max-w-[16rem] truncate text-bone-100 sm:max-w-none">
                  {title}
                </span>
              </li>
            </ol>
          </nav>

          <div className="mt-6 grid gap-10 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-12">
            {/* ------------------------------ Details ------------------------------ */}
            <div className="flex min-w-0 flex-col gap-10">
              <div className="flex flex-col gap-3">
                <p className="text-eyebrow text-accent-300">
                  {vehicle.bodyType} · Registered in {vehicle.registrationCity}
                </p>
                <h1 className="text-3xl text-bone-50 sm:text-4xl lg:text-[2.75rem]">
                  {vehicleFullTitle(vehicle)}
                </h1>
              </div>

              <VehicleGallery
                photos={[{ src: vehicle.image, alt: vehicle.imageAlt }]}
                status={vehicle.status}
                year={vehicle.year}
              />

              <div className="flex flex-col gap-4">
                <h2 className="text-xl text-bone-50 sm:text-2xl">About this car</h2>
                <p className="max-w-2xl text-[0.9375rem] leading-relaxed text-muted-dark sm:text-base">
                  {vehicleDescription(vehicle)}
                </p>
                {isSold ? (
                  <p className="max-w-2xl text-[0.9375rem] leading-relaxed text-bone-200">
                    This car has been sold. Similar stock is listed below, and we
                    will tell you when something comparable comes in.
                  </p>
                ) : null}
              </div>

              <div className="flex flex-col gap-4">
                <h2 className="text-xl text-bone-50 sm:text-2xl">Specifications</h2>
                <SpecTable vehicle={vehicle} />
              </div>

              {/* Kept out of the sticky panel so the panel stays shorter than
                  the viewport — see the note in BuyerChecklist. Sold cars skip
                  it: there is nothing left to go and inspect. */}
              {!isSold ? <BuyerChecklist vehicle={vehicle} /> : null}

              {/*
                Honesty notice. The rows live in Supabase now, but they are
                still the sample set — moving them into a database did not make
                them real. A detail page states far more about a specific car
                than a card does, so the notice belongs here most of all. It
                disappears when `inventoryIsPlaceholder` in src/config/site.ts
                is set to false, which should happen only once the database
                holds real stock and the showroom's own photography.
              */}
              {inventoryIsPlaceholder ? (
                <p className="flex items-start gap-2.5 rounded-xl border border-ink-700 bg-ink-900 px-4 py-3 text-[0.8125rem] leading-relaxed text-muted-dark">
                  <Info
                    aria-hidden="true"
                    className="mt-0.5 size-4 shrink-0 text-accent-400"
                  />
                  <span>
                    <span className="font-semibold text-bone-100">
                      Sample listing for layout only.
                    </span>{" "}
                    This vehicle, its photographs and its figures are
                    placeholders and do not describe a real car in stock. Call the
                    showroom to ask what is actually available.
                  </span>
                </p>
              ) : null}
            </div>

            {/* --------------------------- Enquiry panel ---------------------------
                Sticky on desktop so the price and the call button stay visible
                while the photos and specs scroll past. `self-start` stops the
                grid stretching the item, which is what would otherwise defeat
                `position: sticky`. */}
            <aside className="lg:sticky lg:top-[calc(var(--spacing-nav)+1rem)] lg:self-start">
              <EnquiryPanel vehicle={vehicle} />
            </aside>
          </div>
        </Container>
      </section>

      <SimilarVehicles vehicles={similar} />

      {/* Closing band. Kept to the buying path — accent blue and WhatsApp only. The
          red sell CTA is reserved for the two places the client asked for it,
          and a third red button here would dilute that. */}
      <section className="border-t border-bone-200 bg-bone-50 py-16 sm:py-20">
        <Container>
          <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between lg:gap-16">
            <div className="flex flex-col gap-3">
              <h2 className="text-2xl text-ink-950 sm:text-3xl">
                Not the right car?
              </h2>
              <p className="max-w-xl text-[0.9375rem] leading-relaxed text-muted-light sm:text-base">
                Tell us the make, model and budget you have in mind. If it is not
                on the lot today, we will get in touch when something suitable
                comes in.
              </p>
            </div>

            <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
              <Button href="/cars" variant="primary" size="lg">
                Browse all cars in stock
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(carSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
    </PageTransition>
  );
}
