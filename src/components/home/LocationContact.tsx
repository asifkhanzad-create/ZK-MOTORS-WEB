import { Clock, MapPin, MessageCircle, Navigation, Phone } from "lucide-react";

import { buttonClasses } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { siteConfig, directionsUrl } from "@/config/site";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

const contactRows = [
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
    icon: Clock,
    label: "Opening hours",
    value: `${siteConfig.hours.display} · ${siteConfig.hours.note}`,
    href: null,
    external: false,
  },
];

export function LocationContact() {
  const whatsappUrl = buildWhatsAppUrl();

  return (
    <section className="border-b border-ink-800 bg-ink-900 py-16 sm:py-20 lg:py-24">
      <Container>
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Details */}
          <div className="flex flex-col gap-8">
            <SectionHeading
              eyebrow="Visit us"
              title="Find us in Wah Cantt"
              description={`We serve buyers and sellers across ${siteConfig.serviceArea}. Call ahead and we will have the car ready for you.`}
            />

            <dl className="flex flex-col gap-5">
              {contactRows.map(({ icon: Icon, label, value, href, external }) => (
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
                          className="inline-block py-1 transition-colors duration-200 hover:text-accent-300"
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

            <div className="flex flex-col gap-3 sm:flex-row">
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
              <a
                href={directionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonClasses({
                  variant: "outline",
                  size: "lg",
                  className: "w-full sm:w-auto",
                })}
              >
                <Navigation aria-hidden="true" className="size-4" />
                Get directions
              </a>
            </div>
          </div>

          {/*
            Map placeholder — sized and styled so it can be swapped for a
            Google Maps <iframe> without touching the surrounding layout.
          */}
          <div className="relative aspect-[4/3] overflow-hidden rounded-card border border-ink-700 bg-ink-850 lg:aspect-auto lg:min-h-[26rem]">
            <div
              aria-hidden="true"
              className="absolute inset-0 opacity-40"
              style={{
                backgroundImage:
                  "linear-gradient(to right, rgba(255,255,255,0.055) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.055) 1px, transparent 1px)",
                backgroundSize: "44px 44px",
              }}
            />
            <div
              aria-hidden="true"
              className="absolute left-1/2 top-0 h-full w-24 -translate-x-1/2 bg-accent-500/8"
            />
            <div
              aria-hidden="true"
              className="absolute left-0 top-1/2 h-16 w-full -translate-y-1/2 bg-bone-50/5"
            />

            <div className="relative flex h-full flex-col items-center justify-center gap-4 p-6 text-center">
              <span className="grid size-12 place-items-center rounded-full bg-accent-400 text-ink-950 shadow-[0_8px_24px_-6px_rgba(95,160,232,0.65)]">
                <MapPin aria-hidden="true" className="size-6" />
              </span>
              <div className="flex flex-col gap-1">
                <p className="font-display text-base font-semibold text-bone-50">
                  {siteConfig.address.locality}, {siteConfig.address.region}
                </p>
                <p className="max-w-xs text-[0.8125rem] leading-relaxed text-muted-dark">
                  Map placeholder — drop in the Google Maps embed for the
                  showroom address here.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
