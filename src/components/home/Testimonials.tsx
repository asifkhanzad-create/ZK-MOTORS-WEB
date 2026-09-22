import { Info, Quote } from "lucide-react";

import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { testimonials, testimonialsArePlaceholder } from "@/data/testimonials";

export function Testimonials() {
  return (
    <section className="border-b border-bone-200 bg-bone-50 py-16 sm:py-20 lg:py-24">
      <Container>
        <SectionHeading
          tone="light"
          eyebrow="Feedback"
          title="What customers say"
          description="We would rather show you a few honest lines than a wall of five-star badges."
          align="center"
        />

        <ul className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <li key={testimonial.id}>
              <Reveal delay={index * 70} className="h-full">
                <figure className="flex h-full flex-col gap-5 rounded-card border border-bone-200 bg-white p-6">
                  <Quote
                    aria-hidden="true"
                    className="size-6 text-accent-500"
                  />
                  <blockquote className="text-[0.9375rem] leading-relaxed text-ink-900">
                    &ldquo;{testimonial.quote}&rdquo;
                  </blockquote>
                  <figcaption className="mt-auto border-t border-bone-200 pt-4">
                    <span className="block text-sm font-semibold text-ink-950">
                      {testimonial.name}
                    </span>
                    <span className="block text-[0.8125rem] text-muted-light">
                      {testimonial.city} · {testimonial.context}
                    </span>
                  </figcaption>
                </figure>
              </Reveal>
            </li>
          ))}
        </ul>

        {/*
          Honesty notice. Fictional reviews must never read as verified ones —
          this disappears automatically once real feedback is added.
        */}
        {testimonialsArePlaceholder ? (
          <p className="mx-auto mt-8 flex max-w-2xl items-start gap-2.5 rounded-xl border border-bone-300 bg-bone-100 px-4 py-3 text-[0.8125rem] leading-relaxed text-muted-light">
            <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-accent-700" />
            <span>
              <span className="font-semibold text-ink-900">
                Sample content for layout only.
              </span>{" "}
              These lines are placeholders and do not represent real customers.
              Replace them with genuine feedback before the site goes live.
            </span>
          </p>
        ) : null}
      </Container>
    </section>
  );
}
