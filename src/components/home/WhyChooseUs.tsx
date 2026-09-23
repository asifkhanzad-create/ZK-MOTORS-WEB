import { Handshake, MapPin, Repeat, ShieldCheck } from "lucide-react";

import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { siteConfig } from "@/config/site";

/**
 * Trust section.
 *
 * Deliberately avoids certification/inspection/guarantee claims — these are
 * plain statements about how ZK Motors works, not promises about the stock.
 */
const benefits = [
  {
    icon: ShieldCheck,
    title: "Carefully selected vehicles",
    body: "We look for well-kept cars with clear ownership before they reach the lot, so you are not wasting a trip.",
  },
  {
    icon: Handshake,
    title: "Clear and straightforward dealing",
    body: "The asking price, the condition and the paperwork are explained up front. No pressure and no last-minute surprises.",
  },
  {
    icon: Repeat,
    title: "Sale, purchase and exchange",
    body: "Selling outright or part-exchanging against something on the lot — both are handled in one conversation.",
  },
  {
    icon: MapPin,
    title: "A showroom you can visit",
    body: `Based in ${siteConfig.basedIn}, so viewings, follow-ups and after-sale questions are easy to arrange.`,
  },
];

export function WhyChooseUs() {
  return (
    <section className="border-b border-bone-200 bg-bone-50 py-16 sm:py-20 lg:py-24">
      <Container>
        <SectionHeading
          tone="light"
          eyebrow="Why ZK Motors"
          title="A dealership that keeps things simple"
          description="Straight answers, sensible prices and a local team you can actually reach."
          className="max-w-3xl"
        />

        <ul className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {benefits.map(({ icon: Icon, title, body }, index) => (
            <li key={title}>
              <Reveal delay={index * 60} className="h-full">
                <div className="flex h-full flex-col gap-4 rounded-card border border-bone-200 bg-white p-6 transition-colors duration-200 hover:border-accent-400">
                  <span className="grid size-11 place-items-center rounded-xl bg-accent-500/12 text-accent-700">
                    <Icon aria-hidden="true" className="size-5" />
                  </span>
                  <h3 className="text-lg text-ink-950">{title}</h3>
                  <p className="text-[0.9375rem] leading-relaxed text-muted-light">
                    {body}
                  </p>
                </div>
              </Reveal>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
