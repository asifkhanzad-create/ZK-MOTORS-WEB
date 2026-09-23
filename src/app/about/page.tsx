import { ArrowRight, Minus, MessageCircle, Phone } from "lucide-react";
import type { Metadata } from "next";

import { Button, buttonClasses } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { PageTransition } from "@/components/ui/PageTransition";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { aboutIsPlaceholder, directionsUrl, siteConfig, siteUrl } from "@/config/site";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

/* No brand name here: layout.tsx's title template already appends "| ZK Motors",
   so "About ZK Motors — …" rendered as "… | ZK Motors | ZK Motors". */
const title = "About Us — Used Cars in Wah Cantt";
const description =
  "ZK Motors is a used-car dealership in Wah Cantt that sells cars, buys cars outright and takes cars in exchange. What we list, what we cover, and what we do not claim.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/about" },
  openGraph: {
    type: "website",
    locale: "en_PK",
    url: `${siteUrl}/about`,
    siteName: siteConfig.name,
    title: `${title} | ${siteConfig.name}`,
    description,
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "ZK Motors — about the dealership",
      },
    ],
  },
};

/**
 * About page.
 *
 * The unusual section here is "What we do not claim". It is the honest
 * position for a used-car dealer whose website has not inspected the cars: a
 * page that says plainly what it does not promise is more convincing than one
 * promising everything, and it is the only version this site can support.
 *
 * Every sentence comes from `siteConfig.about` so the client can rewrite it
 * without touching this file. While `aboutIsPlaceholder` is true the page
 * says so out loud, the same way the inventory does.
 */
export default function AboutPage() {
  const whatsappUrl = buildWhatsAppUrl();

  return (
    <PageTransition>
      {/* ================================ Hero ================================ */}
      <section className="border-b border-ink-800 bg-ink-950 py-14 sm:py-16 lg:py-20">
        <Container>
          <div className="flex max-w-3xl flex-col gap-6">
            <p className="text-eyebrow text-accent-300">About</p>

            <h1 className="text-3xl text-bone-50 sm:text-4xl lg:text-[3rem] lg:leading-[1.1]">
              About ZK Motors
            </h1>

            <div className="flex flex-col gap-4">
              {siteConfig.about.intro.map((paragraph) => (
                <p
                  key={paragraph.slice(0, 32)}
                  className="max-w-2xl text-base leading-relaxed text-muted-dark sm:text-[1.0625rem]"
                >
                  {paragraph}
                </p>
              ))}
            </div>

            {aboutIsPlaceholder ? (
              <p className="max-w-2xl rounded-xl border border-ink-700 bg-ink-900 p-4 text-[0.8125rem] leading-relaxed text-muted-dark">
                <span className="font-semibold text-bone-100">
                  Sample content for layout only.
                </span>{" "}
                This description is placeholder text, not the dealership&rsquo;s
                own account. Replace it in <code>src/config/site.ts</code> before
                launch.
              </p>
            ) : null}

            <div className="mt-1 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button
                href="/cars"
                variant="primary"
                size="lg"
                className="w-full sm:w-auto"
              >
                Browse the inventory
                <ArrowRight aria-hidden="true" className="size-4" />
              </Button>

              <Button
                href={directionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                variant="outline"
                size="lg"
                className="w-full sm:w-auto"
              >
                Visit the showroom
              </Button>
            </div>
          </div>
        </Container>
      </section>

      {/* ============================= What we do ============================= */}
      <section className="border-b border-ink-800 bg-ink-900 py-14 sm:py-16 lg:py-20">
        <Container>
          <SectionHeading
            eyebrow="What we do"
            title="Three things, done properly"
            description="Everything on this site serves one of them."
            className="mb-10 sm:mb-12"
          />

          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
            {siteConfig.about.whatWeDo.map((item) => (
              <li
                key={item.title}
                className="flex flex-col gap-3 rounded-card border border-ink-700 bg-ink-850 p-6"
              >
                <h3 className="text-lg font-semibold text-bone-50">{item.title}</h3>
                <p className="text-sm leading-relaxed text-muted-dark">{item.body}</p>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      {/* ========================= What we do not claim ======================== */}
      <section className="bg-bone-50 py-14 sm:py-16 lg:py-20">
        <Container>
          <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
            <SectionHeading
              tone="light"
              eyebrow="In plain terms"
              title="What we do not claim"
              description="Most used-car websites promise more than they can check. We would rather tell you what this site cannot tell you, so you know what to ask when you call."
            />

            <ul className="flex flex-col gap-3">
              {siteConfig.about.honesty.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-3 rounded-xl border border-bone-200 bg-white p-4 text-sm leading-relaxed text-ink-900"
                >
                  <Minus
                    aria-hidden="true"
                    className="mt-0.5 size-4 shrink-0 text-ink-400"
                  />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </Container>
      </section>

      {/* ============================= Closing CTA ============================= */}
      <section className="bg-ink-950 py-14 sm:py-16 lg:py-20">
        <Container>
          <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between lg:gap-16">
            <div className="flex flex-col gap-3">
              <h2 className="text-2xl text-bone-50 sm:text-3xl">
                Come and see the cars
              </h2>
              <p className="max-w-xl text-[0.9375rem] leading-relaxed text-muted-dark sm:text-base">
                {siteConfig.address.full}. {siteConfig.hours.short}.{" "}
                {siteConfig.hours.note}.
              </p>
            </div>

            <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
              <Button
                href={`tel:${siteConfig.contact.phoneE164}`}
                variant="primary"
                size="lg"
              >
                <Phone aria-hidden="true" className="size-4" />
                Call the showroom
              </Button>

              {whatsappUrl ? (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={buttonClasses({
                    variant: "whatsapp",
                    size: "lg",
                  })}
                >
                  <MessageCircle aria-hidden="true" className="size-4" />
                  WhatsApp
                </a>
              ) : null}
            </div>
          </div>
        </Container>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "AboutPage",
            name: title,
            description,
            url: `${siteUrl}/about`,
            about: {
              "@type": "AutoDealer",
              name: siteConfig.name,
              telephone: siteConfig.contact.phoneE164,
              areaServed: siteConfig.areasServed,
            },
          }),
        }}
      />
    </PageTransition>
  );
}
