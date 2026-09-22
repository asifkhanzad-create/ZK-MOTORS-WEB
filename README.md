# ZK Motors — Website

Used-car dealership website for **ZK Motors**, Wah Cantt & Taxila, Punjab, Pakistan.

**Phase 1 (complete): homepage.** **Phase 2 (complete): the `/cars` inventory page with
URL-driven filtering and sorting.** **Phase 3 (complete): the `/cars/{id}` vehicle detail
pages.** The site chrome was then replaced with a floating glass-pill navbar (see
[The navbar](#the-navbar)). The sell-your-car flow, the Supabase backend and the admin
dashboard are planned for later phases and are **not built yet**.

> **All 14 detail pages are prerendered at build time** (`● SSG` in the build output). An
> unknown slug renders the styled 404 rather than erroring.

---

## Running the project

Node.js 20.9+ required (developed on Node 22).

```bash
npm install      # first time only
npm run dev      # development server -> http://localhost:3000
```

Other commands:

```bash
npm run build    # production build
npm run start    # serve the production build
npm run lint     # ESLint
npm run typecheck  # tsc --noEmit
```

---

## Stack

| Concern | Choice |
|---|---|
| Framework | Next.js 16 (App Router, React 19) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4 — tokens in `src/app/globals.css` |
| Icons | lucide-react (brand marks inlined from Simple Icons) |
| Fonts | Montserrat (display + body), self-hosted via `next/font` |
| Images | `next/image`, all local files under `public/vehicles/` |

No other runtime dependencies. The homepage is statically prerendered; `/cars` is
server-rendered on demand because its filter state lives in the URL.

### How `/cars` filtering works

Filter state lives **entirely in the URL** — nothing is held in React state.

```
/cars?make=Toyota&bodyType=SUV&maxPrice=10000000&sort=price-asc
```

`src/lib/inventory.ts` is the single source of truth. It does three things:

| Step | Function | Notes |
|---|---|---|
| Read | `parseFilters(searchParams)` | Validates against live stock. Unknown values are **dropped**, reversed price/year ranges are **swapped**, and the homepage's single `year` param maps onto `minYear`/`maxYear`. |
| Select | `selectVehicles(filters)` | Filter, then sort. |
| Write | `hrefFor(filters)` / `activeChips(filters)` | Builds every link the UI needs. |

This buys three things for free: the back button steps through filter changes, any filtered
list is shareable, and the server renders the finished result with no client fetch and no
loading state.

Two consequences worth preserving:

- **Facet options are derived from actual stock**, not from the union of the domain types.
  Add a hybrid to `src/data/vehicles.ts` and "Hybrid" appears in the filters on its own;
  the UI structurally cannot offer a filter that returns nothing.
- **Pills are links, selects are native controls.** Pills (`<Link>`) survive with JS
  disabled and can be middle-clicked. Selects are native because the keyboard handling and
  the mobile picker beat anything custom. Both write to the URL.

> **Layout trap:** the results toolbar is `sticky` and the mobile filter sheet renders
> *inside* it. The toolbar therefore carries **no `backdrop-blur`** — any `backdrop-filter`
> ancestor becomes the containing block for `position: fixed` descendants, which would clip
> the sheet to the toolbar instead of the viewport. Same reason the navbar's dropped panel is
> a *sibling* of the blurred capsule rather than a child of it.

### The navbar

`src/components/layout/Header.tsx` is a floating glass pill adapted from the CodeFronts
"Pill Highlight Navigation Bar" demo (MIT; the source URL and the five deliberate departures
are in the file header). One capsule at every width, a solid near-white pill marking the
current page, and a card that drops out of the capsule below `lg`.

Four things about it are load-bearing:

- **The capsule carries an 85% `ink-950` scrim**, not the demo's `bg-white/6`. The demo sits
  on a permanently dark page; this site alternates dark and light bands. Over a `bone-50`
  section the demo's version measures **1.00:1** — the capsule and its labels both vanish.
  Measured with the scrim in place: 10.6:1 for the wordmark and 8.1:1 for the links.
- **The header is exactly 86px**, published as `--spacing-nav` in `globals.css`. The results
  toolbar, the `/cars` filter rail and the detail-page enquiry panel all offset by
  `top-nav` / `calc(var(--spacing-nav) + 1rem)` rather than by a literal, so the header can
  change height in one place. `qa/qa-nav.mjs` asserts the rendered height at six viewports.
- **The mobile menu is a real `<button>` disclosure** with `aria-expanded`, `aria-controls`,
  Escape-to-close and focus return. The demo drives its menu from a checkbox and marks the
  label `aria-hidden`, which hides the only way to open it from assistive tech.
- **Nav clicks and scroll position are handled explicitly.** `globals.css` deliberately does
  **not** set `html { scroll-behavior: smooth }`: that property also governs the router's
  own scroll reset, which then animates and settles short — clicking "Cars" from the homepage
  at `scrollY 2400` landed at **131**, part-way down the inventory. A nav link to the route
  you are already on is handled by `handleNavClick`, which scrolls to the top smoothly and
  honours `prefers-reduced-motion`. `qa/qa-nav.mjs` samples `scrollY` mid-flight, so a jump
  cannot pass as an animation.

The current-page pill is **near-white rather than the accent cobalt** — the one place the
two-accent rule is deliberately not applied. On `/cars` the current pill sits inches from the
cobalt "Find a Car" button and both point at `/cars`; two cobalt pills read as a mistake.

### The page cross-fade

A route change replaces the document, so there is nothing to *scroll* — the new page just
appears at the top. `PageTransition` (`components/ui/PageTransition.tsx`) gives that swap a
short cross-fade so navigation reads as continuous rather than abrupt.

It is deliberately asymmetric:

| Trigger | Fires on | Animation |
|---|---|---|
| `enter` / `exit` | Mount / unmount — a real route change | browser cross-fade |
| `update` | A DOM mutation while mounted — every `/cars` filter click | **`none`** |
| `share` | Named element morphs | **`none`** |

The `update="none"` is the load-bearing part. `/cars` keeps its filter state in the URL, so a
filter pill re-renders the page in place — an `update`. `cars/page.tsx` already carries a
deliberate decision against animating that: *"fading the results in each time reads as flicker
rather than polish."* `qa/probe-viewtransition.mjs` counts calls to `document.startViewTransition`
and asserts route changes cross-fade while filter changes do not, so that decision cannot be
undone by accident.

The wrapper renders no DOM node and applies nothing server-side, so the prerendered HTML is
unchanged. Browsers without View Transitions support simply skip the animation. `prefers-reduced-motion`
is handled in `globals.css` — the existing `*` rule cannot reach `::view-transition-*`, because
`*` matches elements, not pseudo-elements.

### The sell flow

`/sell-your-car` (Phase 4) is where the signal red carries the **whole page**
rather than marking one section, because the entire page is the selling path.
That is the reason `SectionHeading` has an `accent` prop.

There is no backend until Phase 5, so the form does not POST anywhere:

1. `ValuationForm` validates locally — required fields, a plausible model year,
   a phone number with enough digits.
2. `sellVehicleMessage()` (`src/lib/whatsapp.ts`) composes the enquiry.
3. The submit handler opens `wa.me` with that message.

The confirmation panel states plainly that **nothing is sent until the visitor
presses send inside WhatsApp**, and offers the link by hand in case a pop-up
blocker swallowed it. `qa/qa-sell.mjs` asserts the panel never claims the
details were sent, and that an invalid submit opens no window at all — the
failure mode being a form that looks like it submitted when it did not.

The FAQ uses native `<details>`/`<summary>`: no JavaScript, keyboard operable
for free. Its `FAQPage` structured data mirrors the rendered questions exactly,
and the harness compares the two element by element — a mismatch between them
is what search engines penalise.

### The two accents

The palette uses **two** accent colours, and the rule matters more than the hues:

| Accent | Token | Used for |
|---|---|---|
| Cobalt blue | `accent-*` | The buying path — primary CTAs, eyebrows, focus rings, icons |
| Red | `signal-*` | The selling path and attention — the Sell/Exchange section, the hero's Sell CTA, the Reserved badge |

Blue = buying, red = selling. If you add red somewhere that isn't the selling path or a
genuine attention state, the system stops meaning anything. The one exception is the navbar's
current-page pill, which is near-white — see [The navbar](#the-navbar).

Colour changes are load-bearing — lightening the charcoal lowers the contrast of everything
on it. After changing any token, run:

```bash
python scripts/verify_theme.py
```

It parses the real `@theme` block and checks 32 foreground/background pairs that exist in
the components, exiting non-zero if any fails.

Note the primary button is `bg-accent-400` with **dark** text. That is what forces the
accent to stay light — a deep accent would need the button switched to white text, which
means editing `Button.tsx`, the skip link in `layout.tsx`, the map pin in
`LocationContact.tsx` and the `Wordmark` monogram.

---

## Where things live

```
src/
  app/
    layout.tsx          fonts, metadata, JSON-LD, header + footer shell
    page.tsx            homepage — composes the nine sections
    cars/page.tsx       inventory page — reads searchParams, renders the grid
    cars/[id]/page.tsx  vehicle detail — prerendered per car, Car JSON-LD
    sell-your-car/      Phase 4 — the sell/exchange flow, FAQ JSON-LD
    about/              who we are + "what we do not claim", AboutPage JSON-LD
    contact/            full details, areas covered, map, ContactPage JSON-LD
    privacy/ terms/     legal drafts, both sharing one shell
    globals.css         DESIGN TOKENS: colours, type, radii, motion,
                        --spacing-nav (the header height everything offsets by)
    not-found.tsx       styled 404
    icon.png            favicon
    apple-icon.png      iOS icon
    robots.ts sitemap.ts
  components/
    layout/             AnnouncementBar, Header (floating pill nav), Footer,
                        Wordmark, MobileWhatsAppButton
    home/               Hero, QuickSearch, FeaturedCars, WhyChooseUs,
                        SellExchange, ProcessSteps, RecentlySold,
                        Testimonials, LocationContact
    inventory/          FilterControls, InventoryToolbar, MobileFilterSheet,
                        ActiveFilterChips, InventoryEmptyState
    sell/               ValuationForm — Phase 4, composes a WhatsApp message
                        instead of POSTing (no backend until Phase 5)
    legal/              LegalDocument — the shared shell for /privacy and /terms
    vehicle/            VehicleGallery, SpecTable, EnquiryPanel,
                        BuyerChecklist, SimilarVehicles
    ui/                 Button, Container, SectionHeading, StatusBadge,
                        VehicleCard, SoldVehicleCard, VehicleImage,
                        Reveal, SocialIcon, PageTransition (route cross-fade),
                        MapPlaceholder (shared by the homepage and /contact)
  config/site.ts        ALL BUSINESS DETAILS — phone, WhatsApp, address, hours
  data/vehicles.ts      SAMPLE INVENTORY (placeholder) + similar-car scoring
  data/testimonials.ts  PLACEHOLDER TESTIMONIALS
  lib/                  format, whatsapp, utils, inventory (filter engine),
                        vehicle (detail-page data shaping)
  types/vehicle.ts      Vehicle domain types
scripts/
  generate_brand_assets.py   regenerates favicon + OG image (re-run after a palette change)
  verify_theme.py            checks 32 real fg/bg contrast pairs against globals.css
  analyse_hero_contrast.py   measures headline contrast over the hero photograph
  measure_badge_contrast.py  measures a status badge against the photo behind it
  accent_contrast.py         explore alternative accent ramps
  contact_sheet.py           builds image review sheets
qa/
  qa-nav.mjs                 site-wide header harness; 62 assertions
  qa-inventory.mjs           Phase 2 harness; 47 assertions
  qa-detail.mjs              Phase 3 harness; 62 assertions
  qa-sell.mjs                Phase 4 + supporting pages; 109 assertions
  measure-badge.mjs          clips a badge to its DOM box for the contrast script
  probe-404.mjs              one-off: which routes emit a React page error
  probe-header.mjs           one-off: header height + what overflows a viewport
  probe-color.mjs            one-off: what format getComputedStyle() returns
  probe-scroll.mjs           one-off: does global smooth scrolling break the reset
  probe-scroll-verify.mjs    measures where a nav click leaves the scroll position
  probe-viewtransition.mjs   when the page cross-fade fires — and when it must not
  shot.mjs                   ad-hoc viewport screenshots for visual review
```

---

## Verification

Four layers, all of which must be green before calling a phase done:

```bash
npm run typecheck        # tsc --noEmit
npm run lint             # eslint
npm run build            # must list 27 prerendered routes, no errors
python scripts/verify_theme.py   # 32 contrast pairs read from globals.css
```

The browser pass needs the production build running:

```bash
NODE_OPTIONS= npm run build && npm run start   # in one terminal
node qa/qa-nav.mjs       http://localhost:3000   # header — 62 assertions
node qa/qa-inventory.mjs http://localhost:3000   # Phase 2 — 47 assertions
node qa/qa-detail.mjs    http://localhost:3000   # Phase 3 — 62 assertions
node qa/qa-sell.mjs      http://localhost:3000   # Phase 4 + the 4 supporting pages — 109 assertions
node qa/probe-viewtransition.mjs http://localhost:3000   # cross-fade fires only on route changes
```

It drives real Microsoft Edge through `playwright-core` (`channel: 'msedge'` — no browser
download) and asserts the things a screenshot cannot show: that the rendered result count
matches the filter in the URL, that the back button restores state, that changing make
clears a stale model, that the mobile sheet fills the viewport rather than being clipped,
that every listing's spec table agrees with the data, that a sold car never offers to be
bought, and that no console errors appear on any route. The header harness additionally
measures the capsule's contrast over a light section from the rendered pixels, checks the
sticky toolbar clears the header, and drives the mobile menu through Escape, outside-click
and focus return.

These harnesses have now caught five defects no screenshot would have shown: a React
hydration mismatch on the 404 route, a status badge that only reached 1.52:1 against a bright
photo, a sticky enquiry panel taller than the viewport, a `hidden md:inline-flex` CTA that
never actually hid (because `cn()` does not merge Tailwind classes), and a header height that
did not match the token every sticky offset depends on. All are documented in `AGENTS.md`.

`scripts/measure_badge_contrast.py` is the odd one out: the status badge is translucent and
sits on top of arbitrary vehicle photography, so its backdrop is not a design token and
cannot be checked from CSS. That script clips the badge to its DOM box and measures the
rendered pixels.

---

## ⚠️ Placeholders to replace before launch

### 1. Business details — `src/config/site.ts`

Everything below is invented and must be replaced. This is the **only** file you need
to edit for contact details; nothing is hard-coded in components.

| Field | Current placeholder |
|---|---|
| `contact.phoneDisplay` | `+92 300 000 0000` |
| `contact.phoneE164` | `+923000000000` |
| `contact.whatsappNumber` | `923000000000` (digits only, no `+`) |
| `contact.email` | `info@zkmotors.pk` |
| `address.street` | `Main G.T. Road` |
| `address.postalCode` | `47040` |
| `hours.display` / `hours.short` | `Mon – Sat, 9:00 AM – 8:00 PM` |
| `social.facebook` / `instagram` / `youtube` | `null` — icons appear automatically once a URL is set |
| `NEXT_PUBLIC_SITE_URL` (env) | defaults to `https://zkmotors.pk` |

The phone number drives every `tel:` link, the WhatsApp number drives every `wa.me`
link, and both feed the `AutoDealer` structured data.

### 2. Vehicle photography — `public/vehicles/`

All 16 photos are free-licence stock standing in for ZK Motors' own photography.
Swap the files **keeping the same filenames**, then update `imageAlt` in
`src/data/vehicles.ts` to describe the real vehicle.

| File | Shown as |
|---|---|
| `corolla-altis.jpg` | Toyota Corolla Altis Grande 1.8 (2021) |
| `civic-oriel.jpg` | Honda Civic Oriel (2022) |
| `fortuner-sigma.jpg` | Toyota Fortuner Sigma 4 (2019) |
| `prado-tx.jpg` | Toyota Land Cruiser Prado TX (2017) |
| `swift-glx.jpg` | Suzuki Swift GLX CVT (2020) |
| `suzuki-ciaz.jpg` | Suzuki Ciaz 1.4 GLX (2019) |
| `suzuki-jimny.jpg` | Suzuki Jimny 1.5 GLX (2021) |
| `suzuki-vitara.jpg` | Suzuki Vitara 1.6 GL+ (2018) |
| `suzuki-grand-vitara.jpg` | Suzuki Grand Vitara 2.4 (2015) |
| `kia-picanto.jpg` | Kia Picanto 1.0 A/T (2021) — marked *reserved* |
| `city-aspire.jpg` | Honda City 1.5 Aspire (2019) — sold ⚠️ **wrong car, see below** |
| `hyundai-kona.jpg` | Hyundai Kona FWD (2019) — sold |
| `hilux-revo.jpg` | Toyota Hilux Revo G (2020) — sold |
| `bmw-x3.jpg` | BMW X3 xDrive30i (2018) — sold |
| `hero-showroom.jpg` | Hero background |
| `sell-exchange.jpg` | "Planning to Sell Your Car?" panel |

**⚠️ Known photo mismatch.** `city-aspire.jpg` is a photograph of a **Toyota Corolla GLi** —
the boot badge reads `TOYOTA` / `COROLLA GLi`, and the plate is an Islamabad plate — but it is
used for the *Honda City 1.5 Aspire* listing. On a small card this is easy to miss; on the
detail page, where the label sits directly above a 600px-wide photo, it is not. Replace the
file with a real Honda City photo, or change that listing to a Corolla.

Cards render at a fixed 4:3 and the detail gallery at 16:10, so source images should be
landscape and at least 1600px wide. Three files are **portrait** (1600×2400):
`city-aspire.jpg`, `hilux-revo.jpg` and `prado-tx.jpg`. `object-cover` centre-crops them, so
only about 42% of their height survives the detail gallery. The Prado happens to crop
acceptably; check any new portrait source rather than assuming.

### 3. Inventory data — `src/data/vehicles.ts`

14 vehicles. Prices, mileages, registration cities and highlights are realistic samples,
not real stock. Distribution is 9 available / 1 reserved / 4 sold, which is deliberate —
it exercises the reserved badge, the sold treatment and the status filter.

`description` is written from the record's own facts (year, trim, mileage, transmission,
registration city) plus what the trim level means in that model range. It deliberately makes
**no** claim about the condition of an individual car — do not add "immaculate",
"accident-free" or similar. `highlight` is the one field that does carry a condition claim,
and it is placeholder text to be replaced with verified information.

The `get*` selectors below the array derive their options from this data, so adding a
vehicle is enough to make its make, model, body type, fuel and city filterable.
`getSimilarVehicles()` scores rather than filters, so it always returns results even for the
cars with no close match (the Hilux pickup, the BMW), and never suggests a sold car.

---

## Notes for the next phase

- **Routes that don't exist yet.** `src/config/site.ts` exports `liveRoutes` and
  `shouldPrefetch()`. Next.js prefetches every `<Link>` in view, so linking to a route
  that doesn't exist yet fires a burst of 404s. **Every route the site links to is now
  live** — `/`, `/cars`, `/sell-your-car`, `/about`, `/contact`, `/privacy`, `/terms` — and the
  `startsWith('/cars/')` check covers every `/cars/{id}` detail route from that one entry.
  **As each new route ships, add it to `liveRoutes`.** That is the only change needed.
  The list being complete is enforced, not assumed: `qa/qa-sell.mjs` crawls every page and
  fails on any internal link that 404s.
- **`sitemap.ts`** lists `/`, `/cars`, every vehicle detail page and the four supporting
  pages. Add each new static route as it ships; do not list filtered inventory URLs (they
  canonicalise to `/cars`). Sold cars are included on purpose — see the comment in that file
  if you'd rather drop them.
- **The quick-search panel** on the homepage already emits `/cars?make=…&minPrice=…&year=…`.
  `parseFilters` handles that exact shape, including the single `year` param.
- **Design tokens** are all in `src/app/globals.css` under `@theme`. Change a colour
  there and it propagates everywhere — except the raster brand assets, which need
  `scripts/generate_brand_assets.py` re-run by hand, and the hardcoded `rgba()` glows in
  `Button.tsx`, `LocationContact.tsx` and `Wordmark.tsx`. `--spacing-nav` is the exception in
  the other direction: it is a *height*, and `qa/qa-nav.mjs` asserts the rendered header
  matches it, so if you change the navbar's padding or control sizes the suite will fail until
  you update the token.
- **The multi-photo gallery branch is untested.** `VehicleGallery` renders a thumbnail rail
  when a vehicle's `gallery` array has entries, but every listing currently has exactly one
  photo, so only the single-photo state has ever run. Add a second photo to a `gallery`
  array and check it before trusting that path.
- **Next up is the Supabase backend** (Phase 5), replacing `src/data/vehicles.ts`. It needs a
  project, keys and schema decisions from the client before any code is worth writing — see
  `AGENTS.md`. The Phase 6 admin dashboard sits behind it.

### 4. Testimonials — `src/data/testimonials.ts`

**Fictional.** The homepage shows a visible "sample content" notice so they can never be
mistaken for real reviews. Replace with genuine feedback and set
`testimonialsArePlaceholder = false` to remove the notice.

### 5. Google Map — `src/components/ui/MapPlaceholder.tsx`

A styled placeholder panel marks where the real embed goes. It lives in `ui/` rather than
`home/` because both the homepage's `LocationContact` section and `/contact` render it, and
two copies would drift. Replace the inner block with your Maps `<iframe>` once; the
surrounding layout does not need to change.

### 6. Brand assets

The "ZK" monogram is a temporary wordmark. Replace `src/app/icon.png`,
`src/app/apple-icon.png` and `public/og-image.jpg` with the real logo. Regenerate the
current ones with `python scripts/generate_brand_assets.py`.

These three are **raster files, so they do not follow the CSS tokens**. If you change the
palette or typeface in `globals.css`, re-run that script — otherwise the favicon and social
preview keep the old colours without any warning. The monogram gradient in the script must
also stay in step with `components/layout/Wordmark.tsx`.
