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
  tagline: "Used Cars in Wah Cantt",

  /**
   * Where the SHOWROOM is. This is not a service boundary.
   *
   * This field used to be called `serviceArea` and read "Wah Cantt & Taxila,
   * Punjab", which made the copy say things like "serving buyers and sellers
   * across Wah Cantt & Taxila" — i.e. that the business only trades there. The
   * showroom is in Wah Cantt; the business is not confined to it. Use this for
   * *where we are* only, and never attach it to a verb about trading
   * ("we buy and sell in X") or to who we serve ("serving X").
   */
  basedIn: "Wah Cantt, Punjab",

  /**
   * Places customers actually travel from. A reach list, not a limit — it feeds
   * the contact-page pills, `areaServed` in the structured data, and the city
   * dropdown on the sell form (which appends "Somewhere else", so a visitor
   * from anywhere else can still submit).
   */
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
     * The real showroom number, supplied by the client. One number for both
     * voice calls and WhatsApp.
     *
     * `display` is what visitors see; `e164` is used for `tel:` and wa.me links.
     * Local form is 0312 5935682 — strip the leading 0 and prefix +92.
     * All three fields must stay in step: `qa/qa-detail.mjs` pins the E.164
     * value and `qa/qa-sell.mjs` asserts the tel: and wa.me links agree.
     */
    phoneDisplay: "+92 312 5935682",
    phoneE164: "+923125935682",
    /** WhatsApp number in international format, digits only — no `+`. */
    whatsappNumber: "923125935682",
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
   * About page.
   *
   * PLACEHOLDER copy. It is written to be true of any small used-car
   * dealership, so it is safe to publish as-is — but it is not this client's
   * own story, and it deliberately contains no founding date, no "years in
   * business", no number of cars sold and no awards, because the site has no
   * way to know any of those and inventing them is the fastest way to lose a
   * customer standing in the showroom. Replace it with the real account;
   * `aboutIsPlaceholder` below shows a notice until you do.
   */
  about: {
    intro: [
      "ZK Motors is a used-car dealership based in Wah Cantt. It sells cars from its own lot, buys cars outright, and takes cars in exchange.",
      "Most people arrive here having seen something on this website, so the aim is simple: put the useful facts in front of you before you pick up the phone. Model year, mileage, transmission, fuel type and asking price are on every listing. What has sold is marked as sold rather than quietly removed.",
    ],

    /** The three things the business actually does. */
    whatWeDo: [
      {
        title: "Sell used cars",
        body: "Cars on the lot, listed with the figures that decide whether a car is worth a phone call.",
      },
      {
        title: "Buy cars outright",
        body: "Send the details and get a response during opening hours. Asking commits you to nothing.",
      },
      {
        title: "Take cars in exchange",
        body: "Put the value of your current car towards one on the lot. Both sides are agreed before any paperwork starts.",
      },
    ],

    /**
     * Deliberately a list of things the business does *not* claim.
     *
     * A used-car dealer saying plainly what it does not promise is more
     * convincing than one promising everything, and it is the only version
     * this website can honestly support — it has not inspected these cars, it
     * does not know their history, and it cannot guarantee a price.
     */
    honesty: [
      "We do not claim every car has been inspected. Ask what has been checked on the specific car you are looking at.",
      "We do not publish accident or ownership history. Ask, and check the documents yourself before you buy.",
      "Prices shown are asking prices, not fixed prices.",
      "A car can sell before its listing is updated. Call to confirm it is still there.",
    ],
  },

  /**
   * The sell-your-car flow at `/sell-your-car`.
   *
   * All of this is editable copy, not logic — the page reads every word from
   * here so the client can change it without touching a component.
   *
   * The answers deliberately promise nothing the business has not agreed to.
   * There is no "best price guaranteed", no valuation figure, and no claim to
   * inspect the car before quoting: the site cannot know any of that, and a
   * used-car seller who over-promises here has to walk it back on the phone.
   */
  sell: {
    /** Condition options for the seller's own car — not the inventory scale. */
    conditions: ["Excellent", "Good", "Fair", "Needs work"],

    /** Shown as a "have these ready" list beside the form. */
    checklist: [
      "The registration book, or the last transfer letter",
      "Your CNIC and the car's registration number",
      "Service records, if you have kept them",
      "The price you have in mind, if you have one",
    ],

    /** The process, in order. Three is the whole process — do not pad it. */
    steps: [
      {
        title: "Send the details",
        body: "Fill in the form, or message the showroom on WhatsApp. Make, model year, mileage and condition are enough to start.",
      },
      {
        title: "We come back with a figure",
        body: "During opening hours you get a response based on what you have told us — no obligation, and nothing to sign.",
      },
      {
        title: "Bring it in to finish",
        body: "If the figure works for you, bring the car and the documents to the showroom. We confirm the price and complete the transfer.",
      },
    ],

    /**
     * Questions sellers actually ask. Answers must stay true to what the
     * business does — several of them are phrased to avoid promising a figure
     * or a turnaround the showroom has not committed to.
     */
    faq: [
      {
        question: "Do you buy cars outright, or only take exchanges?",
        answer:
          "Both. You can sell your car to us for cash, or put its value towards something already in the inventory.",
      },
      {
        question: "How is the figure worked out?",
        answer:
          "From what you tell us — model year, mileage, condition, and how that model is moving at the time. Treat the first figure as an indication, not a final offer: it is confirmed once we have seen the car and the documents.",
      },
      {
        question: "Do I have to bring the car to the showroom first?",
        answer:
          "No. Send the details and get a figure first. Most sellers only bring the car in once there is a number worth discussing.",
      },
      {
        question: "My car is not the kind you usually stock. Is it still worth asking?",
        answer:
          "Yes. The inventory list is what we currently have for sale — it is not a limit on what we will look at.",
      },
      {
        question: "How soon will I hear back?",
        answer:
          "During opening hours. Anything sent outside them is picked up on the next working day. The current hours are listed at the foot of every page.",
      },
    ],
  },

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

/**
 * Marks the About copy above as invented placeholder text.
 *
 * Same pattern as `inventoryIsPlaceholder` below: while this is true the About
 * page shows a notice saying the text is sample copy, so a placeholder can
 * never quietly pass as the client's own history. Set it to false once the real
 * account is written.
 */
export const aboutIsPlaceholder = true;

/**
 * Marks the inventory as sample data rather than real stock.
 *
 * This lived in `src/data/vehicles.ts` while the app read that file. The app
 * reads Supabase now, so the flag moved here — but **its value did not change,
 * and it must not be set to false yet.**
 *
 * Moving rows into a database does not make them real. The 14 records in
 * `public.vehicles` were seeded from the placeholder array, their photographs
 * are free-licence stock images, and one of them (`city-aspire.jpg`) shows a
 * Toyota Corolla on the Honda City listing. None of it describes a car that is
 * actually on the lot.
 *
 * While this is true the vehicle detail page says so plainly, in the place a
 * visitor reads the most specific claims about a specific car. Set it to false
 * only when the database holds real stock with the showroom's own photography
 * and verified `highlight` text — not before, and not because the data moved.
 */
export const inventoryIsPlaceholder = true;

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
 * `/sell-your-car` went live in Phase 4; `/about`, `/contact`, `/privacy` and
 * `/terms` followed, which clears every link the navbar and footer point at.
 */
export const liveRoutes: readonly string[] = [
  "/",
  "/cars",
  "/sell-your-car",
  "/about",
  "/contact",
  "/privacy",
  "/terms",
];

export function shouldPrefetch(href: string): boolean {
  return liveRoutes.some(
    (route) => href === route || href.startsWith(`${route}/`),
  );
}
