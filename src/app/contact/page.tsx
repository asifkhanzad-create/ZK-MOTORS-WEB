import { Check, Clock, Mail, MapPin, MessageCircle, Navigation, Phone } from "lucide-react";
import type { Metadata } from "next";

import { Button, buttonClasses } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { MapPlaceholder } from "@/components/ui/MapPlaceholder";
import { PageTransition } from "@/components/ui/PageTransition";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { directionsUrl, siteConfig, siteUrl } from "@/config/site";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

const title = "Contact ZK Motors — Wah Cantt & Taxila";
const description =
  "Showroom address, opening hours, phone and WhatsApp for ZK Motors in Wah Cantt. Serving buyers and sellers across Wah Cantt, Taxila and nearby areas.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/contact" },
  openGraph: {
    type: "website",
    locale: "en_PK",
    url: `${siteUrl}/contact`,
    siteName: siteConfig.name,
    title: `${title} | ${siteConfig.name}`,
    description,
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "ZK Motors — contact details",
      },
    ],
  },
};

/* Contact details as data rather than markup, so the same list drives both the
   hero's quick facts and the full detail block without drifting apart. */
const details = [
  {
    icon: MapPin,
    label: "Showroom",
    value: siteConfig.address.full,
    href: directionsUrl,
    external: true,
  },
  {
    icon: Phone,
    label: "Phone",
    value: siteConfig.contact.phoneDisplay,
    href: `tel:${siteConfig.contact.phoneE164}`,
    external: false,
  },
  {
    icon: Mail,
    label: "Email",
    value: siteConfig.contact.email,
    href: `mailto:${siteConfig.contact.email}`,
    external: false,
  },
  {
    icon: Clock,
    label: "Opening hours",
    value: `${siteConfig.hours.display} · ${siteConfig.hours.note}`,
    href: null,
    external: false,
  },
];

/**
 * Contact page.
 *
 * Deliberately not a second copy of the homepage's contact section. That one
 * is a teaser; this is the page someone lands on when they have already
 * decided to get in touch, so it carries the full detail set, the directions
 * and the questions worth asking before money changes hands.
 */
export default function ContactPage() {
  const whatsappUrl = buildWhatsAppUrl();

  return (
    <PageTransition>
      {/* ================================ Hero ================================ */}
      <section className="border-b border-ink-800 bg-ink-950 py-14 sm:py-16 lg:py-20">
        <Container>
          <div className="flex max-w-3xl flex-col gap-6">
            <p className="text-eyebrow text-accent-300">Contact</p>

            <h1 className="text-3xl text-bone-50 sm:text-4xl lg:text-[3rem] lg:leading-[1.1]">
              Talk to ZK Motors
            </h1>

            <p className="max-w-xl text-base leading-relaxed text-muted-dark sm:text-[1.0625rem]">
              Call the showroom, message on WhatsApp, or come and look at the
              cars in person. If you are asking about a specific car, quoting its
              model year and mileage gets you a faster answer.
            </p>

            <div className="mt-1 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button
                href={`tel:${siteConfig.contact.phoneE164}`}
                variant="primary"
                size="lg"
                className="w-full sm:w-auto"
              >
                <Phone aria-hidden="true" className="size-4" />
                {siteConfig.contact.phoneDisplay}
              </Button>

              {whatsappUrl ? (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={buttonClasses({
                    variant: "whatsapp",
                    size: "lg",
                    className: "w-full sm:w-auto",
                  })}
                >
                  <MessageCircle aria-hidden="true" className="size-4" />
                  WhatsApp us
                </a>
              ) : null}
            </div>
          </div>
        </Container>
      </section>

      {/* ========================= Details and map ============================ */}
      <section className="border-b border-ink-800 bg-ink-900 py-14 sm:py-16 lg:py-20">
        <Container>
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
            <div className="flex flex-col gap-8">
              <SectionHeading
                title="Where to find us"
                description={`Serving buyers and sellers across ${siteConfig.serviceArea} and the surrounding towns.`}
              />

              <dl className="flex flex-col gap-5">
                {details.map(({ icon: Icon, label, value, href, external }) => (
                  <div key={label} className="flex items-start gap-4">
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-ink-700 bg-ink-850 text-accent-400">
                      <Icon aria-hidden="true" className="size-4" />
                    </span>
                    <div className="min-w-0">
                      <dt className="text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-ink-400">
                        {label}
                      </dt>
                      <dd className="mt-1 text-[0.9375rem] text-bone-100">
                        {href ? (
                          <a
                            href={href}
                            {...(external
                              ? { target: "_blank", rel: "noopener noreferrer" }
                              : {})}
                            className="inline-block break-words py-1 transition-colors duration-200 hover:text-accent-300"
                          >
                            {value}
                          </a>
                        ) : (
                          value
                        )}
                      </dd>
                    </div>
                  </div>
                ))}
              </dl>

              <div>
                <h3 className="text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-ink-400">
                  Areas we cover
                </h3>
                <ul className="mt-3 flex flex-wrap gap-2">
                  {siteConfig.areasServed.map((area) => (
                    <li
                      key={area}
                      className="rounded-full border border-ink-700 px-3 py-1.5 text-[0.8125rem] text-bone-200"
                    >
                      {area}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <MapPlaceholder className="aspect-[4/3] lg:aspect-auto lg:h-full lg:min-h-[24rem]" />
              <Button
                href={directionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                variant="outline"
                size="lg"
                className="w-full"
              >
                <Navigation aria-hidden="true" className="size-4" />
                Open in Google Maps
              </Button>
            </div>
          </div>
        </Container>
      </section>

      {/* ============================ Before you call ========================== */}
      <section className="bg-bone-50 py-14 sm:py-16 lg:py-20">
        <Container>
          <div className="grid gap-10 lg:grid-cols-[1fr_1fr] lg:gap-16">
            <SectionHeading
              tone="light"
              eyebrow="Worth asking"
              title="Before money changes hands"
              description="Nobody at a dealership enjoys being asked these, and that is exactly why they are worth asking. We cannot answer them for a car we have not inspected, so ask us and check the documents yourself."
            />

            <ul className="flex flex-col gap-3">
              {siteConfig.buyerChecklist.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-3 rounded-xl border border-bone-200 bg-white p-4 text-sm text-ink-900"
                >
                  <Check
                    aria-hidden="true"
                    className="mt-0.5 size-4 shrink-0 text-accent-600"
                  />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </Container>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ContactPage",
            name: title,
            description,
            url: `${siteUrl}/contact`,
            about: { "@type": "AutoDealer", name: siteConfig.name },
          }),
        }}
      />
    </PageTransition>
  );
}
