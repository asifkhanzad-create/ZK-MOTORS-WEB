# AGENTS.md

Entry point for any coding agent working in this repo. Read this first, then
`README.md` for the full detail.

## What this is

Website for **ZK Motors**, a used-car dealership in Wah Cantt & Taxila, Punjab,
Pakistan. Next.js 16 (App Router) + TypeScript (strict) + Tailwind CSS v4.

**The goal is enquiries, not traffic.** In priority order: phone calls, WhatsApp
messages, showroom visits. The design, copy and SEO all exist to serve that. A
change that looks better but makes the dealer harder to contact is the wrong
change.

## Phase plan

| Phase | Scope | Status |
|---|---|---|
| 1 | Homepage — 9 sections, design tokens, SEO, structured data | done |
| 2 | `/cars` inventory page with URL-driven filtering and sorting | done |
| 3 | Vehicle detail pages at `/cars/[id]` | **done** |
| 4 | Sell-your-car flow (`/sell-your-car`) | **next, not started** |
| 5 | Supabase backend, replacing the placeholder dataset | not started |
| 6 | Admin dashboard | not started |

**The user reviews each phase before the next one begins. Do not build ahead.**

Between Phase 3 and Phase 4 the site chrome was replaced: the old full-width
sticky header became the floating glass-pill navbar the user supplied. See
"The navbar" under Design rules — it is shared chrome, so it affects every page.

Known gaps as of the last session:

- `/sell-your-car`, `/about` and `/contact` are in the nav and 404. Every
  "Sell Your Car" CTA points at the first of those.
- `src/data/vehicles.ts` holds 14 realistic placeholder vehicles. All 16 photos
  in `public/vehicles/` are free-licence stock standing in for real ones.
- **`city-aspire.jpg` is a photograph of a Toyota Corolla GLi** — the boot badge
  is legible — but it is used for the Honda City listing. Easy to miss on a card,
  obvious on the detail page. Needs a real Honda City photo or a relabelled
  listing. See `README.md`.
- Three photos are portrait (1600×2400) and get centre-cropped by the 16:10
  detail gallery.
- `VehicleGallery`'s multi-photo thumbnail rail has never run — every listing has
  exactly one photo, so `gallery` is empty everywhere.
- Every business detail in `src/config/site.ts` is invented and marked
  `PLACEHOLDER`.

## Non-negotiable conventions

- **All business content lives in `src/config/site.ts`.** Never hard-code a phone
  number, address or opening hours into a component.
- **Vehicle data lives in `src/data/vehicles.ts`**, separate from presentation.
- **Do not add dependencies without asking.** Runtime deps are deliberately just
  `next`, `react`, `react-dom`, `lucide-react`.
- **Never fabricate** discounts, statistics, "certified" or "fully inspected"
  claims, owner counts, or service histories. Placeholder content must be
  realistic but must not read as verified fact.
- Testimonials are fictional and carry a visible "sample content" notice. Do not
  remove that notice while the underlying data is fake.

## Design rules

These came from the user directly and are not up for reinterpretation.

**Two accents, and the rule matters more than the hues:**

- `accent-*` (cobalt blue) — the **buying** path: primary CTAs, eyebrows, focus
  rings, icons.
- `signal-*` (red) — the **selling** path and attention: the Sell/Exchange
  section, the hero's Sell CTA, the Reserved status badge.

Blue = buying, red = selling. Putting red somewhere that isn't the selling path
or a genuine attention state makes the system meaningless.

**One exception, and it is deliberate: the navbar's current-page marker is
near-white, not cobalt.** It is the only place where "current page" used to be
cobalt (an underline) and now is not. On `/cars` the current pill sits a few
hundred pixels from the cobalt "Find a Car" button in the same capsule, and both
point at `/cars`; two cobalt pills read as a mistake. `bone-50` on `ink-950`
says "you are here" (16.5:1) while cobalt says "click me". Do not "restore" it
to cobalt without asking.

**The sell CTAs are filled red, not outlined — the client asked for this twice.**
The hero's "Sell Your Car" and the `/cars` closing band's "Sell or exchange
yours" both use `variant="primarySignal"` (`bg-signal-500` + white text). The
hero therefore shows **two filled buttons side by side** (cobalt Browse, red
Sell). That is intentional. It looks like a hierarchy problem, and on a generic
site it would be one — do not "fix" it back to an outline without asking.
`qa/qa-inventory.mjs` asserts the hero button's computed background is
`rgb(201, 68, 56)` and its label is white, so a revert fails the suite.
`outlineSignal` still exists for the case where a signal action must sit
*subordinate* to a cobalt primary; it currently has no usages.

**Explicitly avoid:** generic template look, excessive glassmorphism, too many
gradients, neon, overdone animation, huge hero text, unnecessary carousels, and
making every section dark. The page alternates light and dark surfaces on
purpose. ("Excessive" is doing the work in that sentence — the navbar capsule is
the one deliberate piece of glass on the site, and it earns it by floating over
both dark and light bands.)

**No decorative dash before eyebrow text.** The user removed these themselves and
described them as "ai slops". `SectionHeading` renders a plain `<p>` with no
leading rule. Do not reintroduce a `h-px w-6 bg-accent-*` ornament.

**Typeface is Montserrat** for both display and body. Eyebrow tracking is 0.1em —
Montserrat is a wide geometric face and 0.16em sprawls.

### The navbar

`src/components/layout/Header.tsx` is a floating glass pill adapted from the
CodeFronts "Pill Highlight Navigation Bar" demo (MIT; the source URL is in the
file header, along with the five deliberate departures from it). The user
supplied that design and asked for it, so **the capsule, the solid active pill
and the dropped mobile card are the design, not a suggestion.**

- **The capsule carries an 85% `ink-950` scrim** (`bg-ink-950/85`), not the
  demo's `bg-white/6`. The demo sits on a permanently dark page; this site
  alternates. Over a `bone-50` band the demo's version measures **1.00:1** — the
  capsule and its labels both vanish.
- **The header is exactly 86px, published as `--spacing-nav`.** Everything that
  sticks below it — `InventoryToolbar`, the `/cars` filter rail, the detail
  enquiry panel — offsets by that token, never by a literal. `qa/qa-nav.mjs`
  asserts the rendered height at six viewports so the token cannot drift.
- **The mobile menu is a `<button>` disclosure, not the demo's checkbox.** The
  demo marks its toggle `aria-hidden`, which hides the only way to open the menu
  from assistive tech, and it has no Escape handler and no focus return.
- `menuOpen` is **derived** from the pathname the panel was opened at, so
  navigating closes it without a `setState`-in-effect. `closeMenu()` on the
  panel's links still matters for links to the page you are already on.

### The page cross-fade

Every page is wrapped in `PageTransition` (`src/components/ui/PageTransition.tsx`),
a client boundary around React's `<ViewTransition>`. A route change replaces the
document, so there is nothing to *scroll*; this gives the swap a short cross-fade.

**`update="none"` is the load-bearing prop.** `enter`/`exit` fire on
mount/unmount — a real route change. `update` fires on a DOM mutation inside the
boundary while it stays mounted, which on `/cars` means *every filter pill click*,
because the filter state lives in the URL and the page re-renders in place.
`cars/page.tsx` already rejects exactly that animation as "flicker rather than
polish". `qa/probe-viewtransition.mjs` counts `document.startViewTransition` calls
and asserts route changes cross-fade **and filter changes do not** — so that
decision cannot be undone by accident. `default="none"` keeps `share` and anything
else unnamed switched off.

The wrapper renders no DOM node and nothing server-side, so prerendered HTML is
unchanged; browsers without View Transitions support skip the animation entirely.

**Colour changes are load-bearing.** Lightening the charcoal base lowers the
contrast of everything placed on it, so the ramps cannot be tweaked casually. The
primary button is `bg-accent-400` carrying **dark** text; that is the constraint
that drives the whole accent ramp. See `README.md` for the verification scripts.

## Verify before claiming anything is done

```bash
npm run typecheck                 # must be 0
npm run lint                      # must be 0
NODE_OPTIONS= npm run build       # note the prefix — see gotchas
python scripts/verify_theme.py    # 32 contrast pairs, must all pass
```

Then, against a running production build:

```bash
npm run build && npm run start
node qa/qa-nav.mjs       http://localhost:3000   # 62 assertions
node qa/qa-inventory.mjs http://localhost:3000   # 47 assertions
node qa/qa-detail.mjs    http://localhost:3000   # 62 assertions
```

The harnesses drive real Microsoft Edge via `playwright-core`
(`channel: 'msedge'`) and assert what a screenshot cannot. `qa-nav.mjs` covers the
site-wide header — the capsule's contrast over a light band, the sticky toolbar
clearing it, the disclosure menu's keyboard behaviour, and where a nav click
leaves the scroll position. `qa-inventory.mjs`
covers URL-driven filtering and the mobile filter sheet; `qa-detail.mjs` covers
the 14 vehicle pages. **Extend an existing harness rather than adding a fourth** —
one file per surface, each with a header comment saying what it covers.

## Gotchas that will bite

- **`next build` fails here with `SAFE_DELETE_BULK_CONFIRM_REQUIRED`.** It is a
  false positive from a Node shim injected via `NODE_OPTIONS`; the compile and
  static generation actually succeed. Always run **`NODE_OPTIONS= npm run build`**.
  `dangerouslyDisableSandbox` does not help.
- **`backdrop-filter` creates a containing block for `position: fixed`
  descendants.** Any fixed overlay must be a *sibling* of a `backdrop-blur`
  ancestor, not a child. The `/cars` results toolbar deliberately carries no blur
  because it hosts the mobile filter sheet, and the navbar's dropped panel is a
  sibling of the blurred capsule — which is also what lets it be wider than the
  capsule. Plain `position: sticky` does **not** have this problem.
- **`html { scroll-behavior: smooth }` breaks Next.js's cross-route scroll reset.**
  The property applies to *every* programmatic scroll, including the one the router
  performs on navigation. The reset then animates from wherever you were and settles
  short: clicking "Cars" from the homepage at `scrollY 2400` landed at **131**, i.e.
  part-way down the inventory. It is deliberately absent from `globals.css`. Nav
  clicks that target the route you are *already* on are handled in `Header.tsx` by
  `handleNavClick`, which calls `scrollTo({ behavior: "smooth" })` itself and checks
  `prefers-reduced-motion` first — the `behavior` option ignores a CSS override, so
  the media query has to be read in JS.
- **Next.js skips its scroll reset when the destination is the current route.** So a
  same-page nav click does nothing at all unless you handle it yourself — that was
  the second half of the same bug.
- **A `*` rule in CSS does not reach `::view-transition-*` pseudo-elements.** `*`
  matches elements; the view-transition pseudo-elements are generated by the
  browser outside the element tree. The site-wide
  `@media (prefers-reduced-motion: reduce) { * { animation-duration: 0.01ms } }`
  block therefore does **not** stop the page cross-fade — it needs its own block
  naming `::view-transition-old(*)`, `::view-transition-new(*)` and
  `::view-transition-group(*)`.
- **Next.js prefetches every in-view `<Link>`.** Unbuilt routes therefore produce
  404 noise. `src/config/site.ts` exports `liveRoutes` and `shouldPrefetch()` —
  **add each route to `liveRoutes` as it ships.**
- **Raster brand assets do not follow the CSS tokens.** `src/app/icon.png`,
  `src/app/apple-icon.png` and `public/og-image.jpg` are generated by
  `scripts/generate_brand_assets.py` and must be re-run by hand after any palette
  or typeface change, or the favicon silently keeps the old look.
- **Hardcoded accent glows** in `Button.tsx`, `LocationContact.tsx` and
  `Wordmark.tsx` are literal `rgba()` values, not token reads. Grep for
  `rgba(95,160,232` when the accent ramp changes.
- **`http_proxy`/`https_proxy` are set in this sandbox.** `curl http://localhost:3000`
  therefore goes *through* the proxy and comes back **502 "upstream connect failed"**
  — a proxy error, not an app error. Always `curl --noproxy '*'` before concluding
  the server is broken. Related: curl and MSYS `grep` disagree about where `/tmp`
  is, so pipe instead of writing a temp file.
- **`&`-backgrounding inside a shell call does not persist.** The child is killed
  the moment the call returns, so `netstat` shows nothing a second later and the
  preview URL is dead. Keep the server alive with the tool's own background mode.
- **The background `next start` process does not survive between sessions.**
  Check port 3000 before handing anyone a preview URL. Use PowerShell
  `Stop-Process` — `taskkill //PID` fails in Git Bash.
- `.workbuddy-ai/` is gitignored on purpose. It is tool state, not project source.
  Anything durable belongs in this file or `README.md`.

### Things Phase 3 caught the hard way

- **Do not set `dynamicParams = false` on `/cars/[id]`.** It looks like a free
  win — unknown slugs 404 without the page function running — but it makes Next
  serve its own static 404 for the unmatched segment, and in the production
  build that produced a **React hydration mismatch (minified error #418)** on
  `/cars/{unknown}`: the server sent the 404 document while the client router
  hydrated the `[id]` tree. It does **not** reproduce in `next dev`, so it only
  shows up in a built site. Leave the default and let `notFound()` handle it.
  `qa/probe-404.mjs` is the throwaway script that isolated this — it compares an
  unknown route under `/cars/` against an unknown route elsewhere.
- **A translucent badge over photography has no controlled backdrop.** The status
  badges were tinted chips (`bg-status-available/12`), which just inherits
  whatever is behind them: measured **1.52:1** where the AVAILABLE badge sat over
  the bright sky in the Prado photo. They now carry a 90% `ink-950` scrim, which
  composites to `#2f3237` over a white pixel and clears 4.5:1 for all three
  labels. Checked in `verify_theme.py` (analytically) and
  `qa/measure-badge.mjs` + `scripts/measure_badge_contrast.py` (from the rendered
  pixels). If you add another badge over a photo, give it a scrim too.
- **Don't string-match Tailwind class names in a test.** `primarySignal`'s base
  classes include `transition-[background-color,border-color,color,...]`, so a
  `/border/` test reports an outline that isn't there — it cost a false failure.
  Read `getComputedStyle` instead.
- **Scope harness selectors to the component under test.** A bare
  `a[href*="wa.me"]` picks the *header's* generic WhatsApp link, not the enquiry
  panel's, so the assertion passes or fails for the wrong reason. Another false
  failure. Use `main aside a[href*="wa.me"]`.
- **Measure a translucent element from its own DOM box.** Clipping a screenshot
  by coordinates read off a scaled-down preview samples the wrong region; and
  even clipped correctly, a `rounded-full` pill has photo showing through its
  corner radius. Locate the element, inset past the end-cap radius, and compare
  against the badge's *background* colour — "brightest pixel" is always a glyph
  anti-aliasing edge.

### Things the navbar work caught the hard way

- **`cn()` does not merge Tailwind classes, and `.inline-flex` is emitted after
  `.hidden`.** `src/lib/utils.ts`'s `cn` is a plain `join`, not tailwind-merge.
  So a `hidden` passed into `buttonClasses({...})` sits in the same class list as
  the variant's own `inline-flex` — and because the compiled sheet emits
  `.inline-flex` (byte 17974) *after* `.hidden` (byte 17918), `inline-flex` wins
  and the element never hides. `hidden md:inline-flex` on a `buttonClasses` result
  therefore does nothing. **Put the responsive display on a wrapper element**
  instead, where `hidden` has no competitor. `md:`/`lg:` *variants* are fine —
  they come after the base utilities, which is why `lg:hidden` works.
- **Chromium reports Tailwind v4's `color-mix()` backgrounds as `oklab(…)`, not
  `rgb()`.** `bg-ink-950/85` computes to
  `oklab(0.221661 -0.00124659 -0.0125306 / 0.85)`. Scraping numbers out of that
  string reads three 0..1 channels as 0..255 and drops the minus signs, so a
  contrast check reports a near-black capsule and a ratio that means nothing —
  it produced a confident, wrong `14.50:1`. Resolve colours through a canvas
  (`ctx.fillStyle = value; getImageData`) and let the engine convert.
- **`addInitScript` runs before the document element exists.** An unguarded
  `document.documentElement.style…` throws a `TypeError` that Playwright reports
  as an **uncaught page error on every route**, which masks the real ones a
  harness is looking for. Guard it, or set the value after each navigation.
- **A content-width capsule cannot absorb a layout mistake the way a full-width
  bar can.** The old full-width header silently rendered "Find a Car" at every
  width and still fit; the same bug in a `w-fit` pill overflowed a 360px viewport.
  Both the `hidden`-vs-`inline-flex` bug and the header-height miscalculation
  surfaced only because the capsule sizes to its content.
- **Measure the header, don't compute it.** The wordmark link carries its own
  `px-3 py-1` and the capsule its own border, so the height is
  `controls + padding + border + float padding` — an easy sum to get wrong twice
  in a row. The token is asserted against the rendered box.

## Where to look

- `README.md` — full architecture, filter design, placeholders, verification.
- `src/app/globals.css` — the design tokens, with the rationale in comments.
  `--spacing-nav` is the header height; every sticky offset below it reads it.
- `src/config/site.ts` — every business detail, all of it replaceable.
- `src/lib/inventory.ts` — the `/cars` filter engine.
- `src/lib/vehicle.ts` — detail-page data shaping + schema.org availability.
- `src/components/vehicle/` — the detail-page components.
- `src/components/ui/Button.tsx` — the whole colour system in one place.
- `qa/qa-nav.mjs` — the site-wide header harness: capsule contrast, sticky
  offsets, disclosure-menu keyboard behaviour.
- `qa/qa-detail.mjs` — the Phase 3 harness; its header explains what it covers.
