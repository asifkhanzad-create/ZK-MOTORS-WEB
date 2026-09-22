import { ArrowRight, Check, MessageCircle } from "lucide-react";
import Image from "next/image";

import { Button, buttonClasses } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { buildWhatsAppUrl, sellEnquiryMessage } from "@/lib/whatsapp";

/** What the visitor should have ready — keeps the WhatsApp message useful. */
const detailsToShare = [
  "Make, model and model year",
  "Mileage and transmission",
  "Registration city and documents",
  "Your expected price, if you have one",
];

/**
 * The one section that carries the signal-red accent. Red is reserved for the
 * selling/exchange path, so this section reads as a distinct business line
 * rather than as decoration on top of the cobalt one.
 */
export function SellExchange() {
  const whatsappUrl = buildWhatsAppUrl(sellEnquiryMessage);

  return (
    <section className="border-b border-ink-800 bg-ink-900 py-16 sm:py-20 lg:py-24">
      <Container>
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Copy */}
          <div className="flex flex-col gap-6">
            <p className="text-eyebrow text-signal-300">Sell or exchange</p>

            <h2 className="text-3xl text-bone-50 sm:text-4xl lg:text-[2.75rem]">
              Planning to Sell Your Car?
            </h2>

            <p className="max-w-xl text-base leading-relaxed text-muted-dark sm:text-[1.0625rem]">
              Share a few basic details about your vehicle and ZK Motors will
              come back to you with a response. Whether you are selling outright
              or exchanging for something already on the lot, it starts with one
              message or one visit.
            </p>

            <ul className="flex flex-col gap-3">
              {detailsToShare.map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm text-bone-200">
                  <Check aria-hidden="true" className="size-4 shrink-0 text-signal-400" />
                  {item}
                </li>
              ))}
            </ul>

            <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button
                href="/sell-your-car"
                variant="primarySignal"
                size="lg"
                className="w-full sm:w-auto"
              >
                Sell Your Car
                <ArrowRight aria-hidden="true" className="size-4" />
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

          {/* Visual */}
          <Reveal className="lg:order-last">
            <div className="relative overflow-hidden rounded-card border border-ink-700">
              <Image
                src="/vehicles/sell-exchange.jpg"
                alt="A car parked at sunset, representing a vehicle being offered for sale"
                width={1080}
                height={720}
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="h-full w-full object-cover"
              />
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-gradient-to-t from-ink-950/70 via-transparent to-transparent"
              />
            </div>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
