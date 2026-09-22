/**
 * ============================================================================
 * PLACEHOLDER TESTIMONIALS — NOT REAL CUSTOMER FEEDBACK
 * ============================================================================
 * These are written samples used only to show the layout. They are flagged
 * `isPlaceholder: true`, and the homepage renders a visible notice alongside
 * them so they can never be mistaken for verified reviews.
 *
 * Before launch: replace with real, permission-granted customer feedback and
 * set `testimonialsArePlaceholder` to false to remove the notice.
 */

export interface Testimonial {
  id: string;
  quote: string;
  name: string;
  city: string;
  /** Vehicle involved, kept generic so it does not imply a specific sale. */
  context: string;
  isPlaceholder: boolean;
}

export const testimonialsArePlaceholder = true;

export const testimonials: Testimonial[] = [
  {
    id: "sample-1",
    quote:
      "The price we discussed on the phone was the price on the day. That is really all I wanted from a dealership.",
    name: "Sample customer",
    city: "Wah Cantt",
    context: "Bought a sedan",
    isPlaceholder: true,
  },
  {
    id: "sample-2",
    quote:
      "They took my old car in exchange and walked me through the transfer paperwork step by step.",
    name: "Sample customer",
    city: "Taxila",
    context: "Exchanged a hatchback",
    isPlaceholder: true,
  },
  {
    id: "sample-3",
    quote:
      "I asked a few questions on WhatsApp before driving over, which saved me a wasted trip.",
    name: "Sample customer",
    city: "Islamabad",
    context: "Enquired about an SUV",
    isPlaceholder: true,
  },
];
