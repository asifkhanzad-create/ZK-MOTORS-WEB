import { CarFront, Handshake, MapPinned } from "lucide-react";

import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";

const steps = [
  {
    icon: CarFront,
    title: "Choose or share a vehicle",
    body: "Browse the cars on the lot, or send us the details of the car you want to sell or exchange.",
  },
  {
    icon: Handshake,
    title: "Contact ZK Motors",
    body: "Call, message on WhatsApp or drop by. We will confirm availability, price and what paperwork is needed.",
  },
  {
    icon: MapPinned,
    title: "Visit, inspect and complete the deal",
    body: "See the car in person, take it for a drive and finish the transfer with our help.",
  },
];

export function ProcessSteps() {
  return (
    <section className="border-b border-bone-200 bg-bone-100 py-16 sm:py-20 lg:py-24">
      <Container>
        <SectionHeading
          tone="light"
          eyebrow="How it works"
          title="Three simple steps"
          description="No drawn-out process — most deals are settled in a single visit."
          align="center"
        />

        <ol className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
          {steps.map(({ icon: Icon, title, body }, index) => (
            <li key={title}>
              <Reveal delay={index * 80} className="h-full">
                <div className="relative flex h-full flex-col gap-4 rounded-card border border-bone-200 bg-bone-50 p-6">
                  <div className="flex items-center justify-between">
                    <span className="grid size-11 place-items-center rounded-xl bg-ink-950 text-accent-400">
                      <Icon aria-hidden="true" className="size-5" />
                    </span>
                    <span
                      aria-hidden="true"
                      className="font-display text-3xl font-bold text-bone-300"
                    >
                      {String(index + 1).padStart(2, "0")}
                    </span>
                  </div>

                  <h3 className="text-lg text-ink-950">
                    <span className="sr-only">Step {index + 1}: </span>
                    {title}
                  </h3>
                  <p className="text-[0.9375rem] leading-relaxed text-muted-light">
                    {body}
                  </p>
                </div>
              </Reveal>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}
