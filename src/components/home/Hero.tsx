import { ArrowRight, MessageCircle, ShieldCheck, Tag } from "lucide-react";
import Image from "next/image";

import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { siteConfig } from "@/config/site";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

/** Small reassurance points under the CTAs. */
const heroPoints = [
  { icon: Tag, label: "Buy · Sell · Exchange" },
  { icon: ShieldCheck, label: "Personal assistance" },
];

export function Hero() {
  const whatsappUrl = buildWhatsAppUrl();

  return (
    <section className="relative isolate overflow-hidden bg-ink-950">
      {/*
        Photography-led background. Two stacked scrims keep the photo visible on
        the right while guaranteeing text contrast on the left: the vertical
        gradient carries mobile (text spans the width), the horizontal one takes
        over from lg where the copy sits in a solid-dark column.
      */}
      <Image
        src="/vehicles/hero-showroom.jpg"
        alt=""
        aria-hidden="true"
        fill
        priority
        sizes="100vw"
        className="-z-10 object-cover object-center"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-ink-950/45 lg:bg-ink-950/25"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-gradient-to-t from-ink-950 via-ink-950/80 to-ink-950/45 lg:bg-gradient-to-r lg:from-ink-950 lg:via-ink-950/85 lg:to-transparent"
      />

      <Container>
        <div className="flex max-w-2xl flex-col gap-7 py-16 sm:py-20 lg:py-24">
          <p className="text-eyebrow text-accent-300">
            Trusted car dealership in Wah Cantt &amp; Taxila
          </p>

          <h1 className="text-4xl leading-[1.08] text-bone-50 sm:text-5xl lg:text-[3.5rem]">
            Find a Car You&rsquo;ll Love to Drive
          </h1>

          <p className="max-w-xl text-base leading-relaxed text-bone-200 sm:text-lg">
            Buy, sell and exchange quality used cars with straightforward
            dealing and personal assistance from {siteConfig.name}.
          </p>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button
              href="/cars"
              variant="primary"
              size="lg"
              className="w-full sm:w-auto"
            >
              Browse Available Cars
              <ArrowRight aria-hidden="true" className="size-4" />
            </Button>
            <Button
              href="/sell-your-car"
              variant="outlineSignal"
              size="lg"
              className="w-full sm:w-auto"
            >
              Sell Your Car
            </Button>
          </div>

          {whatsappUrl ? (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex w-fit items-center gap-2 py-2.5 text-sm font-medium text-bone-100 transition-colors duration-200 hover:text-whatsapp"
            >
              <MessageCircle aria-hidden="true" className="size-4" />
              <span>Prefer WhatsApp? Message us directly</span>
              <ArrowRight
                aria-hidden="true"
                className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transform-none"
              />
            </a>
          ) : null}

          <ul className="mt-2 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-bone-50/12 pt-6">
            {heroPoints.map(({ icon: Icon, label }) => (
              <li
                key={label}
                className="flex items-center gap-2 text-sm text-bone-200"
              >
                <Icon aria-hidden="true" className="size-4 text-accent-400" />
                {label}
              </li>
            ))}
            <li className="flex items-center gap-2 text-sm text-bone-200">
              <span aria-hidden="true" className="size-1.5 rounded-full bg-accent-400" />
              Serving {siteConfig.serviceArea}
            </li>
          </ul>
        </div>
      </Container>
    </section>
  );
}
