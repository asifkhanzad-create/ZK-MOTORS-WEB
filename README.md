# ZK Motors — Website

Used-car dealership website for **ZK Motors**, Wah Cantt & Taxila, Punjab, Pakistan.

**Phase 1 (complete): homepage.** **Phase 2 (complete): the `/cars` inventory page with
URL-driven filtering and sorting.** Vehicle-detail pages, the sell-your-car flow, the
Supabase backend and the admin dashboard are planned for later phases and are **not built
yet**.

> ⚠️ **Known gap:** vehicle cards link to `/cars/{id}`. Those detail pages are Phase 3 and
> currently land on the styled 404, which explains the situation and points back at the
> inventory. Nothing else is broken by this.

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
> the sheet to the toolbar instead of the viewport. Same reason `MobileNav` is a sibling of
> `<header>` rather than a child.

### The two accents

The palette uses **two** accent colours, and the rule matters more than the hues:

| Accent | Token | Used for |
|---|---|---|
| Cobalt blue | `accent-*` | The buying path — primary CTAs, eyebrows, focus rings, nav, icons |
| Red | `signal-*` | The selling path and attention — the Sell/Exchange section, the hero's Sell CTA, the Reserved badge |

Blue = buying, red = selling. If you add red somewhere that isn't the selling path or a
genuine attention state, the system stops meaning anything.

Colour changes are load-bearing — lightening the charcoal lowers the contrast of everything
on it. After changing any token, run:

```bash
python scripts/verify_theme.py
```

It parses the real `@theme` block and checks 27 foreground/background pairs that exist in
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
    globals.css         DESIGN TOKENS: colours, type, radii, motion
    not-found.tsx       styled 404 (covers routes not built yet)
    icon.png            favicon
    apple-icon.png      iOS icon
    robots.ts sitemap.ts
  components/
    layout/             AnnouncementBar, Header, MobileNav, Footer,
                        Wordmark, MobileWhatsAppButton
    home/               Hero, QuickSearch, FeaturedCars, WhyChooseUs,
                        SellExchange, ProcessSteps, RecentlySold,
                        Testimonials, LocationContact
    inventory/          FilterControls, InventoryToolbar, MobileFilterSheet,
                        ActiveFilterChips, InventoryEmptyState
    ui/                 Button, Container, SectionHeading, StatusBadge,
                        VehicleCard, SoldVehicleCard, VehicleImage,
                        Reveal, SocialIcon
  config/site.ts        ALL BUSINESS DETAILS — phone, WhatsApp, address, hours
  data/vehicles.ts      SAMPLE INVENTORY (placeholder)
  data/testimonials.ts  PLACEHOLDER TESTIMONIALS
  lib/                  format, whatsapp, utils, inventory (filter engine)
  types/vehicle.ts      Vehicle domain types
scripts/
  generate_brand_assets.py   regenerates favicon + OG image (re-run after a palette change)
  verify_theme.py            checks 27 real fg/bg contrast pairs against globals.css
  analyse_hero_contrast.py   measures headline contrast over the hero photograph
  accent_contrast.py         explore alternative accent ramps
  contact_sheet.py           builds image review sheets
qa/
  qa-inventory.mjs           drives the built site in Edge; 44 assertions
  shot.mjs                   ad-hoc viewport screenshots for visual review
```

---

## Verification

Three layers, all of which must be green before calling a phase done:

```bash
npm run typecheck        # tsc --noEmit
npm run lint             # eslint
npm run build            # must list 8 routes, no errors
python scripts/verify_theme.py   # 27 contrast pairs read from globals.css
```

The browser pass needs the production build running:

```bash
npm run build && npm run start          # in one terminal
node qa/qa-inventory.mjs http://localhost:3000
```

It drives real Microsoft Edge through `playwright-core` (`channel: 'msedge'` — no browser
download) and asserts the things a screenshot cannot show: that the rendered result count
matches the filter in the URL, that the back button restores state, that changing make
clears a stale model, that the mobile sheet fills the viewport rather than being clipped,
and that no console errors appear on any route.

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
| `city-aspire.jpg` | Honda City 1.5 Aspire (2019) — sold |
| `hyundai-kona.jpg` | Hyundai Kona FWD (2019) — sold |
| `hilux-revo.jpg` | Toyota Hilux Revo G (2020) — sold |
| `bmw-x3.jpg` | BMW X3 xDrive30i (2018) — sold |
| `hero-showroom.jpg` | Hero background |
| `sell-exchange.jpg` | "Planning to Sell Your Car?" panel |

Cards render at a fixed 4:3, so source images should be landscape and at least
1600px wide. Portrait sources get centre-cropped by `object-cover` — check the result
rather than assuming.

### 3. Inventory data — `src/data/vehicles.ts`

14 vehicles. Prices, mileages, registration cities and highlights are realistic samples,
not real stock. Distribution is 9 available / 1 reserved / 4 sold, which is deliberate —
it exercises the reserved badge, the sold treatment and the status filter.

The `get*` selectors below the array derive their options from this data, so adding a
vehicle is enough to make its make, model, body type, fuel and city filterable.

---

## Notes for the next phase

- **Routes that don't exist yet.** `src/config/site.ts` exports `liveRoutes` and
  `shouldPrefetch()`. Next.js prefetches every `<Link>` in view, so linking to a route
  that doesn't exist yet fires a burst of 404s. `/` and `/cars` are live. **As each route
  ships, add it to `liveRoutes`.** That is the only change needed.
- **Vehicle cards link to `/cars/{id}`** — the Phase 3 detail route, which is *not* in
  `liveRoutes`. Those links currently land on the styled 404. That page's copy is written
  for exactly this case, but it should be revisited once Phase 3 ships.
- **`sitemap.ts`** lists `/` and `/cars`. Add each new route as it ships; do not list
  filtered inventory URLs (they canonicalise to `/cars`).
- **The quick-search panel** on the homepage already emits `/cars?make=…&minPrice=…&year=…`.
  `parseFilters` handles that exact shape, including the single `year` param.
- **Design tokens** are all in `src/app/globals.css` under `@theme`. Change a colour
  there and it propagates everywhere — except the raster brand assets, which need
  `scripts/generate_brand_assets.py` re-run by hand.

### 4. Testimonials — `src/data/testimonials.ts`

**Fictional.** The homepage shows a visible "sample content" notice so they can never be
mistaken for real reviews. Replace with genuine feedback and set
`testimonialsArePlaceholder = false` to remove the notice.

### 5. Google Map — `src/components/home/LocationContact.tsx`

A styled placeholder panel marks where the real embed goes. Replace the inner block with
your Maps `<iframe>`; the surrounding layout does not need to change.

### 6. Brand assets

The "ZK" monogram is a temporary wordmark. Replace `src/app/icon.png`,
`src/app/apple-icon.png` and `public/og-image.jpg` with the real logo. Regenerate the
current ones with `python scripts/generate_brand_assets.py`.

These three are **raster files, so they do not follow the CSS tokens**. If you change the
palette or typeface in `globals.css`, re-run that script — otherwise the favicon and social
preview keep the old colours without any warning. The monogram gradient in the script must
also stay in step with `components/layout/Wordmark.tsx`.
