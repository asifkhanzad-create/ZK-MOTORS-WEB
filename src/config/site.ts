/**
 * ============================================================================
 * CENTRAL BUSINESS CONFIGURATION
 * ============================================================================
 * Every business detail on the site reads from this file.
 * Replace the placeholder values below with real ZK Motors details — you should
 * not need to touch any component to do it.
 *
 * Anything marked `PLACEHOLDER` is invented and must be replaced before launch.
 */

export const siteConfig = {
  name: "ZK Motors",
  /** Shown in the footer and used in structured data. */
  legalName: "ZK Motors",
  tagline: "Used Cars in Wah Cantt & Taxila",

  /** Primary service area — referenced in copy and structured data. */
  serviceArea: "Wah Cantt & Taxila, Punjab",
  areasServed: [
    "Wah Cantt",
    "Taxila",
    "Hasan Abdal",
    "Attock",
    "Islamabad",
    "Rawalpindi",
  ],

  contact: {
    /**
     * PLACEHOLDER — replace with the real showroom number.
     * `display` is what visitors see; `e164` is used for tel: and wa.me links.
     */
    phoneDisplay: "+92 300 000 0000",
    phoneE164: "+923000000000",
    /** PLACEHOLDER — WhatsApp number in international format, digits only. */
    whatsappNumber: "923000000000",
    /** PLACEHOLDER — replace with the real inbox. */
    email: "info@zkmotors.pk",
  },

  address: {
    /** PLACEHOLDER — replace with the real showroom address. */
    street: "Main G.T. Road",
    locality: "Wah Cantt",
    region: "Punjab",
    postalCode: "47040",
    country: "PK",
    /** Single-line version for display. */
    get full() {
      return `${this.street}, ${this.locality}, ${this.region}, Pakistan`;
    },
  },

  /** PLACEHOLDER — confirm the real opening hours before launch. */
  hours: {
    display: "Mon – Sat, 9:00 AM – 8:00 PM",
    short: "Open Mon – Sat, 9am – 8pm",
    note: "Closed on Sunday",
  },

  /**
   * PLACEHOLDER — add real profile URLs, or set to null to hide the icon.
   * The footer only renders social links that have a URL.
   */
  social: {
    facebook: null as string | null,
    instagram: null as string | null,
    youtube: null as string | null,
    tiktok: null as string | null,
  },

  /** Primary navigation. `href` values map to future routes. */
  nav: [
    { label: "Home", href: "/" },
    { label: "Cars", href: "/cars" },
    { label: "Sell Your Car", href: "/sell-your-car" },
    { label: "About", href: "/about" },
    { label: "Contact", href: "/contact" },
  ],

  /** Pre-filled WhatsApp message used by every WhatsApp CTA. */
  whatsappMessage:
    "Hello ZK Motors, I would like to enquire about a vehicle.",

  /**
   * Shown on every vehicle detail page.
   *
   * These are the things a used-car buyer should ask about that this website
   * genuinely cannot answer on a car's behalf. They are written as questions
   * rather than statements on purpose: the site has not inspected these cars,
   * so it must not imply otherwise. Edit this list to match what your team
   * actually checks before a car goes on the lot.
   */
  buyerChecklist: [
    "Service history and the date of the last service",
    "How many previous owners the car has had",
    "Any accident or insurance history",
    "Tyre condition and remaining tread",
    "Documents, token tax and transfer status",
    "Whether the asking price is negotiable",
  ],
} as const;

export type SiteConfig = typeof siteConfig;

/** Absolute site URL — used for metadata and structured data. */
export const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://zkmotors.pk";

/**
 * Google Maps search link for the showroom. A plain search URL works without
 * an API key, which keeps this a zero-dependency map link.
 *
 * Lives here rather than in each component because it was already being built
 * separately in the footer and the contact section, and the vehicle detail
 * page needed it too — three copies of one URL is three places to forget when
 * the address changes.
 */
export const directionsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
  siteConfig.address.full,
)}`;

/**
 * Routes that are actually built and reachable right now.
 *
 * Next.js prefetches every <Link> in view, so linking to a route that does not
 * exist yet produces a burst of 404s in the console and wastes requests.
 * `shouldPrefetch` keeps navigation prefetching enabled for live routes and off
 * for planned ones.
 *
 * Phase 2+: add each route here as it ships — that is the only change needed.
 * `/cars` and the vehicle detail routes under it (`/cars/{id}`) are both live
 * as of Phase 3. The `startsWith(`${route}/`)` check below covers every detail
 * route from the single `/cars` entry, so no per-vehicle entry is needed.
 */
export const liveRoutes: readonly string[] = ["/", "/cars"];

export function shouldPrefetch(href: string): boolean {
  return liveRoutes.some(
    (route) => href === route || href.startsWith(`${route}/`),
  );
}
