import { ArrowRight, Check, Clock, MapPin, MessageCircle, Phone } from "lucide-react";
import type { Metadata } from "next";

import { ValuationForm } from "@/components/sell/ValuationForm";
import { Button, buttonClasses } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { PageTransition } from "@/components/ui/PageTransition";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { directionsUrl, siteConfig, siteUrl } from "@/config/site";
import { buildWhatsAppUrl, sellEnquiryMessage } from "@/lib/whatsapp";

const title = "Sell or Exchange Your Car in Wah Cantt & Taxila";
const description =
  "Sell your car to ZK Motors or exchange it for something in the inventory. Send the make, model year, mileage and condition, and get a response during opening hours — no obligation.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/sell-your-car" },
  openGraph: {
    type: "website",
    locale: "en_PK",
    url: `${siteUrl}/sell-your-car`,
    siteName: siteConfig.name,
    title: `${title} | ${siteConfig.name}`,
    description,
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "ZK Motors — sell or exchange your car",
      },
    ],
  },
};

/**
 * Sell-your-car page — Phase 4.
 *
 * This is the one page where the signal red carries the whole surface rather
 * than marking a single section: it is the selling path end to end, so the
 * eyebrows, the numbers and the primary action are all red. Cobalt does not
 * appear except where a genuinely neutral action is needed.
 *
 * The page does not quote a figure, promise a turnaround, or claim to inspect
 * the car. The site cannot know any of those things, and a dealership that
 * over-promises here has to walk it back on the phone.
 */
export default function SellYourCarPage() {
  const whatsappUrl = buildWhatsAppUrl(sellEnquiryMessage);

  /* FAQ structured data. Mirrors the questions rendered below — a mismatch
     between the two is what gets a site penalised, so keep them in step. */
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: siteConfig.sell.faq.map((entry) => ({
      "@type": "Question",
      name: entry.question,
      acceptedAnswer: { "@type": "Answer", text: entry.answer },
    })),
  };

  return (
    <PageTransition>
      {/* ================================ Hero ================================ */}
      <section className="border-b border-ink-800 bg-ink-950 py-14 sm:py-16 lg:py-20">
        <Container>
          <div className="grid items-start gap-12 lg:grid-cols-[1.15fr_1fr] lg:gap-16">
            <div className="flex flex-col gap-6">
              <p className="text-eyebrow text-signal-300">Sell or exchange</p>

              <h1 className="text-3xl text-bone-50 sm:text-4xl lg:text-[3rem] lg:leading-[1.1]">
                Sell your car to ZK Motors
              </h1>

              <p className="max-w-xl text-base leading-relaxed text-muted-dark sm:text-[1.0625rem]">
                Send us the basics — make, model year, mileage, condition — and
                we come back to you with a figure. Sell outright for cash, or put
                the value towards something already on the lot. No obligation,
                and nothing to sign to get a number.
              </p>

              <div className="mt-1 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button
                  href="#valuation"
                  variant="primarySignal"
                  size="lg"
                  className="w-full sm:w-auto"
                >
                  Start the form
                  <ArrowRight aria-hidden="true" className="size-4" />
                </Button>
                {whatsappUrl ? (
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={buttonClasses({
                      variant: "outline",
                      size: "lg",
                      className: "w-full sm:w-auto",
                    })}
                  >
                    <MessageCircle aria-hidden="true" className="size-4" />
                    Message instead
                  </a>
                ) : null}
              </div>

              <p className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-ink-400">
                <span className="inline-flex items-center gap-2">
                  <Clock aria-hidden="true" className="size-4 text-signal-400" />
                  {siteConfig.hours.display}
                </span>
                <span className="inline-flex items-center gap-2">
                  <MapPin aria-hidden="true" className="size-4 text-signal-400" />
                  {siteConfig.address.locality}
                </span>
              </p>
            </div>

            {/* What to have ready. Useful content rather than a decorative
                image, and it sets expectations before the form asks for it. */}
            <div className="rounded-card border border-ink-700 bg-ink-900 p-6 sm:p-7">
              <h2 className="text-lg font-semibold text-bone-50">
                Have these to hand
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-dark">
                Not required to get a first response — but it speeds up the final
                figure.
              </p>
              <ul className="mt-5 flex flex-col gap-3">
                {siteConfig.sell.checklist.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-bone-200">
                    <Check
                      aria-hidden="true"
                      className="mt-0.5 size-4 shrink-0 text-signal-400"
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Container>
      </section>

      {/* ================================ Form ================================ */}
      {/* scroll-mt clears the sticky header, so the "Start the form" anchor
          does not park the heading underneath the navbar. */}
      <section
        id="valuation"
        className="scroll-mt-[calc(var(--spacing-nav)+1rem)] border-b border-bone-200 bg-bone-50 py-14 sm:py-16 lg:py-20"
      >
        <Container>
          <SectionHeading
            tone="light"
            accent="signal"
            eyebrow="Get a figure"
            title="Tell us about the car"
            description="About a minute to fill in. Everything except the notes and your expected price is needed to give you a sensible response."
            className="mb-8 sm:mb-10"
          />

          <div className="lg:grid lg:grid-cols-[1fr_18rem] lg:gap-10">
            <div className="min-w-0">
              <ValuationForm />
            </div>

            {/* Sticky reassurance rail on wide screens only — on a phone it
                would just push the form further down. */}
            <aside className="mt-10 flex flex-col gap-5 lg:mt-0 lg:sticky lg:top-[calc(var(--spacing-nav)+1rem)] lg:self-start">
              <div className="rounded-card border border-bone-200 bg-white p-5">
                <h3 className="text-sm font-semibold text-ink-950">
                  What happens to your details
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-light">
                  The form builds a WhatsApp message on your own device. Nothing
                  is stored on this website, and nothing is sent anywhere until
                  you press send in WhatsApp.
                </p>
              </div>

              <div className="rounded-card border border-bone-200 bg-white p-5">
                <h3 className="text-sm font-semibold text-ink-950">
                  Rather just talk?
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-light">
                  Call the showroom and describe the car. Same result, no typing.
                </p>
                <a
                  href={`tel:${siteConfig.contact.phoneE164}`}
                  className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-ink-950 transition-colors hover:text-signal-600"
                >
                  <Phone aria-hidden="true" className="size-4 text-signal-600" />
                  {siteConfig.contact.phoneDisplay}
                </a>
              </div>
            </aside>
          </div>
        </Container>
      </section>

      {/* ============================= How it works ============================ */}
      <section className="border-b border-ink-800 bg-ink-900 py-14 sm:py-16 lg:py-20">
        <Container>
          <SectionHeading
            accent="signal"
            eyebrow="How it works"
            title="Three steps, no paperwork to start"
            description="The first step costs you nothing and commits you to nothing."
            className="mb-10 sm:mb-12"
          />

          <ol className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 lg:gap-10">
            {siteConfig.sell.steps.map((step, index) => (
              <li key={step.title} className="flex flex-col gap-3">
                <span
                  aria-hidden="true"
                  className="font-display text-3xl font-bold text-signal-400"
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="text-lg font-semibold text-bone-50">{step.title}</h3>
                <p className="text-sm leading-relaxed text-muted-dark">{step.body}</p>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      {/* ================================= FAQ ================================ */}
      <section className="border-b border-bone-200 bg-bone-50 py-14 sm:py-16 lg:py-20">
        <Container size="narrow">
          <SectionHeading
            tone="light"
            accent="signal"
            eyebrow="Questions"
            title="Before you send anything"
            className="mb-8 sm:mb-10"
          />

          {/* Native details/summary: works with no JavaScript, is keyboard
              operable for free, and is announced correctly by screen readers. */}
          <div className="flex flex-col divide-y divide-bone-200 border-y border-bone-200">
            {siteConfig.sell.faq.map((entry) => (
              <details key={entry.question} className="group py-5">
                <summary className="flex cursor-pointer items-start justify-between gap-4 text-base font-semibold text-ink-950 marker:content-['']">
                  {entry.question}
                  <span
                    aria-hidden="true"
                    className="mt-0.5 shrink-0 text-lg leading-none text-signal-600 transition-transform duration-200 group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-light">
                  {entry.answer}
                </p>
              </details>
            ))}
          </div>
        </Container>
      </section>

      {/* ============================= Closing CTA ============================= */}
      <section className="bg-ink-950 py-14 sm:py-16 lg:py-20">
        <Container>
          <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between lg:gap-16">
            <div className="flex flex-col gap-3">
              <h2 className="text-2xl text-bone-50 sm:text-3xl">
                Or bring it to the showroom
              </h2>
              <p className="max-w-xl text-[0.9375rem] leading-relaxed text-muted-dark sm:text-base">
                {siteConfig.address.full}. {siteConfig.hours.short}.{" "}
                {siteConfig.hours.note}.
              </p>
            </div>

            <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
              <Button
                href={`tel:${siteConfig.contact.phoneE164}`}
                variant="primarySignal"
                size="lg"
              >
                <Phone aria-hidden="true" className="size-4" />
                Call the showroom
              </Button>

              <Button
                href={directionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                variant="outline"
                size="lg"
              >
                <MapPin aria-hidden="true" className="size-4" />
                Get directions
              </Button>
            </div>
          </div>
        </Container>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
    </PageTransition>
  );
}
