# AGENTS.md

Entry point for any coding agent working in this repo. Read this first, then
`README.md` for the full detail.

## What this is

Website for **ZK Motors**, a used-car dealership with a showroom in Wah Cantt,
Punjab, Pakistan. Next.js 16 (App Router) + TypeScript (strict) + Tailwind CSS v4.

**Where the business is vs. who it deals with — do not conflate them.** The
showroom is in Wah Cantt and saying so is correct and useful. The business is
*not* confined to Wah Cantt and Taxila, and the copy must never read as though it
is. The client raised this directly after the site repeatedly said things like
"serving buyers and sellers across Wah Cantt & Taxila". Concretely:

- Use `siteConfig.basedIn` for *where we are* ("our showroom in …", "visit us in …").
- Never attach a place to a verb about trading ("we buy and sell in X") or to who
  we serve ("serving X", "areas we cover", "local to X").
- `siteConfig.areasServed` is a **reach list** — places customers travel from. It
  feeds the contact-page pills and the structured data, and it is deliberately
  wider than the showroom town.
- "Taxila" is still legitimate as a city facet derived from stock, as a vehicle
  registration city, as a testimonial author's city, and in the `areaServed`
  list. It is the *boundary framing* that is banned, not the word.
- `qa/qa-sell.mjs` enforces this: it scans the visible text of five pages for the
  banned phrasings and fails if any return, with a canary assertion so the scan
  cannot pass on a blank page.

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
| 4 | Sell-your-car flow (`/sell-your-car`) | **done** |
| 5 | Supabase backend, replacing the placeholder dataset | **done** |
| 6 | Admin dashboard | **built — needs two things in the Supabase dashboard, see below** |

**The user reviews each phase before the next one begins. Do not build ahead.**

**Phase 6 is code-complete, all three setup items are in place, and the signed-in
half has now run for real** (2026-09-24).

Item 3 is checked and green. Items 1 and 2 were unverifiable from the outside, and
are now confirmed the strongest way available: **the owner signed in and added a
car through the dashboard.** The row is `lc300` (Toyota Land Cruiser, 2022,
PKR 96,500,000), and its `image` is a timestamped
`vehicle-photos/lc300-1790200749239.webp` that resolves 200 and decodes as a real
852×568 WebP. So sign-in, the form, validation, the insert, the Storage upload —
including the WebP branch — and the public read path have all executed against the
live project. It is worth being precise about what that does *not* cover: the
automated round trip in `qa/qa-admin-authenticated.mjs` has still never run, so
edit / unpublish / delete are unexercised, and **unpublish is the one that would
reveal `0002_admin_access.sql` not having been applied.**

The 14 seeded rows are still placeholder stock. `lc300` is not — it is real stock
from the client. So the dataset is now mixed, and `inventoryIsPlaceholder` in
`src/config/site.ts` is still `true`, which is now only *mostly* accurate. Worth
raising when the real photos land.

1. An admin user in **Authentication → Users** (email + password, no invite mail
   needed — "Add user" lets you set one directly). **Tick "Auto Confirm User."**
   Email confirmation is on by default on hosted projects, so an account created
   without it cannot sign in — and the app shows the same generic message as a
   wrong password, so it reads as "the password is wrong."
2. `supabase/migrations/0002_admin_access.sql` run in the SQL editor. Without it
   the dashboard lists only published cars and every draft looks deleted — the
   symptom is described in the file's own header.
3. Turn **off** "Allow new users to sign up" (Authentication → **Sign In /
   Providers**; the page is labelled **Settings** on some projects). Every write
   policy is granted `to authenticated`, so an open sign-up form is an open door
   to the stock table. `optional_admin_email_lock.sql` is the second layer if that
   setting is ever missed.

**Item 3 was reported done once while still open.** `GET /auth/v1/settings`
returned `disable_signup = false` and a probe registration returned HTTP 200 with a
real user id. It is now `true`, and a fresh registration is refused with
`signup_disabled` (HTTP 422) creating nothing. `qa/probe-supabase.mjs` asserts this
as a hard failure — **run the probe, do not trust the dashboard**, which has three
similarly-worded toggles on one page.

One leftover account from that probe, `qa-signup-probe-zk@gmail.com`, was still
present afterwards (signing in as it returns `email_not_confirmed`, which only a
live account can do). It cannot sign in while unconfirmed, but it should be deleted
from **Authentication → Users**. Deleting it needs the dashboard — the app
deliberately holds no admin API key.

Everything reachable while signed out is verified by `qa/qa-admin.mjs`.

Between Phase 3 and Phase 4 the site chrome was replaced: the old full-width
sticky header became the floating glass-pill navbar the user supplied. See
"The navbar" under Design rules — it is shared chrome, so it affects every page.

Known gaps as of the last session:

- **The four previously-dead routes now ship**: `/about`, `/contact`, `/privacy`
  and `/terms` were built after Phase 4. They were never in the phase plan —
  they were linked from every page and all four 404ed, which is a trust problem
  on a site whose job is to look credible. `qa/qa-sell.mjs` used to carry a
  `knownUnbuilt` allowance for them; **that allowance is deleted**, and the scan
  now asserts zero dead internal links site-wide. Do not reintroduce a whitelist.
  `/privacy` and `/terms` are honest drafts, not legal advice, and both say so on
  the page. `/about` is marked `aboutIsPlaceholder` in `src/config/site.ts`.
- **Stock is in Postgres, not in the repo.** `src/data/vehicles.ts` survives only
  as the seed source — the app does not import it. `src/data/testimonials.ts` is
  still placeholder. All 16 photos in `public/vehicles/` are free-licence stock
  standing in for real ones; the 14 car photos are also in Supabase Storage,
  which is what the site now serves.
- **`city-aspire.jpg` is a photograph of a Toyota Corolla GLi** — the boot badge
  is legible — but it is used for the Honda City listing. Easy to miss on a card,
  obvious on the detail page. Needs a real Honda City photo or a relabelled
  listing. See `README.md`.
- Three photos are portrait (1600×2400) and get centre-cropped by the 16:10
  detail gallery.
- `VehicleGallery`'s multi-photo thumbnail rail has never run — every listing has
  exactly one photo, so `gallery` is empty everywhere.
- **The phone number is real now** (`+92 312 5935682`, supplied by the client, one
  number for both calls and WhatsApp). Everything else in
  `src/config/site.ts` is still invented and marked `PLACEHOLDER` — the email,
  the street address, the opening hours, the social URLs and the logo. The number
  is load-bearing: every WhatsApp CTA and the sell form's composed message are
  built from it, and it appears in the structured data, so changing it means
  changing all three fields together (`phoneDisplay` / `phoneE164` /
  `whatsappNumber`). `qa/qa-detail.mjs` pins the E.164 value; `qa/qa-sell.mjs`
  asserts the dialled and WhatsApp numbers agree.
- The navbar's current-page pill is `bone-50`, which contradicts the documented
  "accent = nav active state" rule. It reads well, but it is an exception nobody
  has signed off. Raise it.
- **The site has never been deployed.** There is no hosting config of any kind —
  no `vercel.json`, no workflow. It runs only on a local `next start`. For a site
  whose entire purpose is generating phone calls, "how does this get to a domain"
  is an open question that is not in the phase plan.

## Phase 5 — Supabase (done)

Phase 5 replaces the placeholder dataset with Supabase. **The open questions were
put to the client and answered on 2026-09-23 — do not re-litigate them:**

| Decision | Answer | Consequence |
|---|---|---|
| Photos | **Supabase Storage** | bucket + policy, and `remotePatterns` in `next.config.ts`; `public/vehicles/` retires |
| Sell form | **Stays WhatsApp-only** | no submissions table, no PII stored, `/privacy` stays accurate |
| Admin auth | **Supabase Auth, email + password** | `vehicles` needs a write policy keyed to `authenticated` |
| Hosting | **Vercel** | env vars set in the dashboard; revalidation works natively |
| Rendering | static + on-demand revalidation | see *The rendering decision* below |

**Status — what is already done (2026-09-23):**

| Step | State |
|---|---|
| Supabase project created | done — ref `wlwnfgtrilzikdyigctu` |
| `0001_vehicles.sql` run | done — 21 columns, 4 policies, RLS enabled |
| `.env.local` + `next.config.ts` `remotePatterns` | done |
| `@supabase/supabase-js` installed, typed client in `src/lib/supabase.ts` | done |
| `src/lib/vehicle-mapper.ts` + `src/lib/vehicles-source.ts` | written, **not wired in** |
| `qa/unit-vehicle-mapper.mjs` — 8 unit tests, no database needed | done, 8/8 |
| `supabase/seed.sql` run | done — 14 rows, `published = true` |
| Seed verified faithful to the source data | done — `qa/verify-seed.mjs`, all 14 identical |
| `vehicle-photos` Storage bucket | done — exists and is publicly readable (verified) |
| 14 photos uploaded to Storage | done — all 14 verified byte-for-byte against the local files |
| `seed-storage.sql` run (image columns → Storage URLs) | done — all 14 stored URLs fetch 200 |
| Data layer swapped | **done** — the app reads Supabase; nothing in `src/app` or `src/components` imports the placeholder array |

**Phase 5 is complete.** The site renders live database rows: 14 detail pages prerendered from
Supabase at build, the homepage reading the table, and `/cars` filtering real stock.

**The sample-data notice is still on.** `inventoryIsPlaceholder` moved from `src/data/vehicles.ts`
to `src/config/site.ts` and **is still `true`**, which keeps the "Sample listing for layout only"
notice on every vehicle detail page. That is correct and deliberate: the 14 rows were seeded from
the placeholder array, the photos are free-licence stock images, and `city-aspire.jpg` shows a
Toyota Corolla on the Honda City listing. Moving rows into a database did not make them real. Set
it to false only when the table holds real stock with the showroom's own photography.

**The sell form still does not POST.** That is a decision, not a gap — it is the one form that
would collect a name and phone number from the public, and `/privacy` states the site stores no
personal data. It composes a WhatsApp message instead. Do not "finish" it by adding a write.

#### How the swap is put together

**Stock is a parameter, not an import.** `src/lib/facets.ts` holds every stock-derived helper
(`getMakes`, `getYears`, `getStatusCounts`, `getSimilarVehicles`, …) as a **pure function of a
`Vehicle[]`**. It also holds the fixed domain lists (`transmissions`, `fuelTypes`, `bodyTypes`,
`priceSteps`), which are deliberately *not* derived from stock — see the note on the sell form
below. `parseFilters(raw, list)` and `selectVehicles(filters, list)` in `src/lib/inventory.ts` take
the list for the same reason. There is no longer any single array to close over.

**One read per page, threaded down.** Server pages call `fetchVehicles()` and pass the list to the
components that need it. Three are client components and take it as a prop — `QuickSearch`,
`FilterControls` (via `InventoryToolbar` → `MobileFilterSheet`) and `ValuationForm` (which takes
only `makes`, for its `<datalist>`). `fetchVehicles` is wrapped in React's `cache()`, so the two
calls a detail page makes (`generateMetadata` and the page body) are one round trip.

**The detail page fetches the whole list, not one row.** It needs the pool to score similar
vehicles against, so a targeted single-row query would be a *second* round trip to save nothing.
`fetchVehicleById` was removed for that reason.

**Filtering stays in JavaScript.** `matches()` and `sortVehicles()` are unchanged and applied to
the fetched list. Reimplementing them as SQL would create two definitions of "matches" that can
drift silently, and at dealership scale it buys nothing.

**`src/data/vehicles.ts` is a seed source now, not app data.** Nothing under `src/app` or
`src/components` imports it. It survives because `scripts/generate_seed_sql.mjs` generates from it
and `qa/verify-seed.mjs` compares the live table against it. **Editing a car there changes nothing
on the site** — edit the row in Supabase.

**Images are absolute URLs now.** `vehicle.image` holds a Supabase Storage URL, so
`${siteUrl}${vehicle.image}` produced `https://zkmotors.pkhttps://wlwnf…`. Both structured-data
call sites go through `absoluteImageUrl()` in `src/lib/format.ts`, which passes an already-absolute
URL through untouched.

**Empty stock is a real state, not an error.** `getPriceBounds` returns `null` for an empty list
rather than `{min: 0, max: 0}` — `Math.min(...[])` is `Infinity`, which the min-price ladder would
have filtered down to zero options. `/cars` omits the "From" figure rather than printing
"PKR Infinity".

**A failed read is visible, not disguised.** `fetchVehicles` throws. `/cars` catches it and renders
an `InventoryUnavailable` panel with the phone and WhatsApp buttons — it does **not** fall back to
the placeholder array, because showing invented cars as real stock is worse than showing none and
the visitor cannot tell the difference. `/sell-your-car` swallows the error on purpose: only its
`<datalist>` depends on stock, so a valuation enquiry is still worth capturing while the listing
side is down.

**Prerendered pages revalidate every five minutes** (`export const revalidate = 300` on `/` and
`/cars/[id]`; 3600 on the sitemap). Without a window the build-time snapshot would be the only one
that ever shipped, so a car marked sold would stay listed until someone deployed again. The Phase 6
admin dashboard should call `revalidatePath()` for an immediate update; these windows are the
backstop for edits made directly in Supabase.

`node --env-file=.env.local qa/probe-supabase.mjs` reports the live state of all of
this in one command. Run it before assuming anything about the remote project.

**It also reads `/auth/v1/settings`, and asserts `disable_signup === true`.** That
is a deliberate hard failure, not a warning. Every write policy in both migrations
is `to authenticated`, so *any* account at all can edit, publish and delete stock —
and the project URL ships to every visitor's browser. While sign-ups are open,
anyone can register, confirm an address they control, and start editing listings.
The dashboard's sign-in page is not a control; the policies are. This check was
added because the setting was found still open after being reported as done, and
there was no way to tell without asking the server. `mailer_autoconfirm` is printed
next to it but not asserted — `false` is the safer value (a self-registered account
cannot sign in until it confirms), but it is a speed bump, not a lock.

**The round trip is proven, and now through `fetchVehicles()` as well.**
`qa/verify-seed.mjs` reads all 14 rows over the network, maps them with the
production `toVehicle()`, and compares every field against `src/data/vehicles.ts`
— so the query, the mapper and the data are all verified against real rows. Since
the Phase 5 swap, `fetchVehicles()` is that same query and mapper on the real
request path, exercised on every render of `/`, `/cars`, the detail pages and the
sitemap, so it is no longer "the one thing never executed".

**The seed check caught a bug in itself, which is worth remembering.** Its first run
reported 8 failures, all `featured: source=undefined db=false`. The source omits the key
for a non-featured car; the column is `not null default false`, so the database stores
`false`. Those are the same fact and `getFeaturedVehicles()` cannot tell them apart — the
comparison was too strict, not the seed. Fixed by normalising per field. A check that
reports a problem is not automatically right.

**The mapping is unit-tested and the test was watched failing.** `toVehicle()` lives in
`src/lib/vehicle-mapper.ts` with only type imports, which is what lets
`qa/unit-vehicle-mapper.mjs` import it under Node's type stripping with no database and
no path-alias resolution. Injecting a plausible bug (`row.registrationCity` instead of
`row.registration_city`) made it fail with `expected: 'Islamabad'` — a mis-cased field
renders as empty text rather than throwing, so the end-to-end harnesses would only catch
it by luck.

**Verified against the live project, not assumed:** an anonymous SELECT returns `[]`
with HTTP 200 (RLS filtering, not erroring) and an anonymous INSERT is rejected with
`42501` / HTTP 401. The write policies are real. Anonymous bucket creation and object
upload both return `403`.

**Testing Storage anonymously — and a false negative that cost a round trip.** The probe
originally called `storage.getBucket()` to check the bucket existed. That is an **admin**
API: the publishable key cannot use it, so it returned an error *whether or not the bucket
was there*, and the probe reported a missing bucket that the client had in fact already
created. The reliable anonymous test is to request a public object and read the error
`code` — `NoSuchBucket` means the bucket is missing, `NoSuchKey` means the bucket is fine
and only that object is absent. `qa/probe-supabase.mjs` now does this, with a control
assertion that a deliberately impossible bucket name reports `NoSuchBucket`. Keep that
control: without it, a change to the error codes would silently turn the photo checks into
a report that everything is present.

**"Missing" and "private" look identical from outside.** Supabase's error-code docs warn
that both codes are also returned when you merely lack permission — `NoSuchBucket` when
the bucket "exists [but] you don't have permissions to access it". So a private bucket
answers `NoSuchBucket`, and the two causes are indistinguishable by that request alone.
The probe separates them by asking a different question: request an object that certainly
does not exist, in the real bucket. `NoSuchKey` back means the bucket lookup succeeded, so
the bucket is public; `NoSuchBucket` means missing *or* private. This is worth the extra
request because a private bucket accepts the upload and then serves nothing — presenting
as a failed upload, when the fix is one toggle. **Verified 2026-09-24: the
`vehicle-photos` bucket exists and is publicly readable.**

**Two traps already hit, so expect them:**

- **Pasting the migration's *path* into the SQL editor** is a `42601` syntax error —
  the editor executes SQL text, not filenames. The same applies to `seed.sql` and
  `seed-storage.sql`. It also cannot run shell commands: a `node …` line pasted there
  fails the same way. Keep terminal steps and SQL-editor steps in separate blocks when
  writing instructions, because a mixed block is what produced both errors.
- **The probe's RLS assertions are vacuous on an empty table.** "Every visible row is
  published" is trivially true with zero rows, so it now prints a `WARN` when the
  table is empty rather than letting an empty database read as "RLS verified".

**Photos upload in two matched steps.** Upload the 14 stock photos to `vehicle-photos`,
then run `supabase/seed-storage.sql` to rewrite the `image` columns. Running the second
before the first 404s every image on the site. The probe is the gate between them.
`storage-upload/` (gitignored) holds exactly those 14 files so the upload is a
select-all rather than a 14-of-16 pick; it is scratch and can be deleted afterwards.

**Keys.** The browser-safe key is now issued as `sb_publishable_...` (the old "anon"
JWT, renamed). `NEXT_PUBLIC_SUPABASE_ANON_KEY` keeps the conventional name because
`@supabase/supabase-js` takes it as the `anonKey` option. The service-role key
(`sb_secret_...`) bypasses row-level security and must never reach the browser — if a
write path needs it, that write happens in a server action or route handler. It is
deliberately unset, because reads do not need it.

**The blast radius is smaller than it looks.** `src/data/vehicles.ts` is the only
module that holds data; everything else goes through `src/lib/inventory.ts`
(`selectVehicles`, `getMakes`, `getModels`, `getBodyTypes`, `getPriceBounds`, …).
Seven server consumers (`/cars`, `/cars/[id]`, `sitemap.ts`, `FeaturedCars`,
`RecentlySold`, `QuickSearch`, `ValuationForm`) call those helpers, and **not one of
them reads the array's internals**. So the swap is: keep every signature, change
what the body reads from.

Two consequences worth deciding up front:

- **Filtering should stay in JavaScript at first.** `matches()` in
  `src/lib/inventory.ts` is the filter engine. The tempting move is to reimplement
  it as SQL `where` clauses; that creates two definitions of "matches" that drift
  silently, and buys nothing at dealership scale (hundreds of rows). Fetch the
  rows, run `matches()` as-is, revisit only if stock reaches thousands.
- **Three consumers are client components** (`FilterControls`, `QuickSearch`,
  `ValuationForm`) and call the facet getters **synchronously**. They cannot
  `await` a query. Facets must therefore be fetched in the server page and passed
  down as props — not fetched inside the components. This is the one place where
  "just make it async" does not work.

**The rendering decision.** *(Corrected — the earlier note here said the site was
"fully static: 27 prerendered routes, zero runtime data fetching". That was wrong,
and the measurement matters.)* Read off `.next/prerender-manifest.json` and the
response headers, the site is **two kinds of page, not one**:

| Route | Behaviour | Header |
|---|---|---|
| `/cars` | **already dynamic** — awaits `searchParams`, rendered per request | `no-store` |
| `/`, `/about`, `/contact`, `/privacy`, `/terms`, `/sell-your-car` | prerendered | `x-nextjs-cache: HIT` |
| `/cars/[id]` ×14 | prerendered per vehicle | `x-nextjs-cache: HIT` |

So the fork is smaller than feared: **the inventory index — the one page that needs
to query stock — already runs on every request**, and reading Postgres there costs
nothing architecturally. The real decision is only about the prerendered pages, and
the answer is **static plus on-demand revalidation**, not time-based: call
`revalidatePath()` from the admin save action.

The trap: a prerendered page is written at build time, so **without revalidation a
car marked "sold" keeps showing as available until the next deploy.** For a
dealership that is a business bug, not a caching detail.
   Do not solve any of this by moving filtering to the client — see below.

**Constraints that must survive Phase 5:**

- **The URL-driven filter engine stays.** `parseFilters` → `selectVehicles` →
  `hrefFor` in `src/lib/inventory.ts`. Back button, shareable URLs, no loading
  state. The tempting move — "now that there's a database, fetch on the client" —
  throws all of that away.
- **Facets must still derive from actual stock** (`getMakes()`, `getBodyTypes()`, …).
  A database makes it easier to query the distinct values; do that rather than
  hardcoding a list, so the UI still cannot offer a filter that returns nothing.
- **`inventoryIsPlaceholder` and the visible "sample content" notices** exist so
  fake content cannot read as verified. When real data lands, turn them off in the
  same commit — and not before, because stock that is still sample stock must keep
  the notice.
- **`/privacy` currently states there are no accounts and no cookies.** That claim
  is about site *visitors*, and admin auth is a separate surface — but the moment
  anything cookie-based touches a public page, that page is wrong and must be
  updated in the same commit.

## Phase 6 — the admin dashboard

Stock management at `/admin`. Signed-in only, `noindex`, never cached.

| Route | What it is |
|---|---|
| `/admin/login` | Email + password sign-in. Outside the enforced layout. |
| `/admin` | Every listing, published or draft, with one-click status / publish / feature / delete. |
| `/admin/cars/new` | Add a car, with photo upload. |
| `/admin/cars/[id]` | Edit a car. |

Files: `src/proxy.ts` (session refresh), `src/lib/auth.ts` (`getAdmin` /
`requireAdmin`), `src/lib/supabase-server.ts` (cookie-backed client),
`src/lib/admin-vehicles.ts` (unfiltered reads), `src/app/admin/vehicle-actions.ts`
(every write), `src/lib/vehicle-form.ts`, `src/components/admin/*`.

### `proxy.ts`, not `middleware.ts`

Next.js 16 renamed the convention. The file is `src/proxy.ts` and the exported
function is `proxy`. A `middleware.ts` would simply **never run** — which presents
as "auth is broken", not as "the file is named wrong". The build output confirms
it with a `ƒ Proxy (Middleware)` line; if that line disappears, the session
refresh has stopped and admins will be signed out at random.

### `getClaims()`, never `getSession()`

`getSession()` reads the session out of the cookie and returns the user object
without verifying it. A cookie is a string the visitor controls, so trusting it
means anyone can forge an admin session. `getClaims()` verifies the token's
signature. It is the only auth call in `src/lib/auth.ts`, and it must stay that
way.

### The proxy is scoped to `/admin`, and that is load-bearing twice over

The matcher is `["/admin/:path*"]`. Running it site-wide would mean calling
`getClaims()` on pages that are prerendered and ISR-cached, and **a cached
response carrying `Set-Cookie` can hand one visitor another visitor's session** —
Supabase's own docs warn about this. Scoping it also keeps `/privacy` honest: the
policy says the public pages set no cookies, and no public page touches auth.

### `requireAdmin()` is the real gate, not the proxy

The proxy only refreshes the session and turns "signed out" into a redirect. A
Server Action is a public HTTP endpoint reachable without navigating, so **every
action calls `requireAdmin()` first**. The `(dashboard)` route group holds the
enforced layout; `/admin/login` sits outside it, because a layout that redirects
to the login page cannot wrap the login page.

### Two things `0001_vehicles.sql` did not cover

- **Admins could not read drafts.** Its select policy is `using (published = true)`
  with **no `to` clause**, so it applies to every role including `authenticated`,
  and there was no second select policy. Writes were granted; reading drafts was
  not. `0002_admin_access.sql` adds it. **The symptom is memorable:** unpublishing
  a car makes it vanish from the dashboard too, which looks exactly like deletion.
- **Storage had no write policy.** Uploads need `storage.objects` policies for
  the `vehicle-photos` bucket; same file.

### Server Actions cap the body at 1MB by default

A phone photo is several megabytes, so without
`experimental.serverActions.bodySizeLimit` in `next.config.ts` every upload fails
with a rejection that never reaches the action and looks nothing like "too big".
It is set to 12MB, deliberately above the app's own 10MB per-file check, so the
message the admin sees names the real limit.

### The `Database` type silently did nothing until Phase 6

`src/types/database.ts` declared `VehicleRow` and `VehicleInsert` as
**`interface`s**. Supabase only applies the `Database` type when
`Database["public"]` satisfies `GenericSchema`, whose `Tables` is
`Record<string, GenericTable>` — and TypeScript gives an interface no implicit
index signature, so an interface fails that check. The schema fell back to `any`:
`.select()` returned `any` and `.insert()` resolved its parameter to `never`.

Nothing errored at the point of the mistake, which is why it survived from Phase 5
until the first write path was written. **They are `type` aliases now, and must
stay that way.** `scripts/verify_schema.py` cannot catch this — it is a
TypeScript assignability rule, not a schema mismatch. The way to test it is to
assert that a deliberately wrong insert *fails* to compile.

### Admin reads use their own shape and their own query

`fetchAdminVehicles()` does **not** filter by `published`; `fetchVehicles()` does,
and that filter is the only thing between a draft and the public site. Two
different questions, two different queries — not one query with a flag.

`toAdminVehicle()` extends `Vehicle` with `published`, `createdAt` and
`updatedAt`. `toVehicle()` drops those on purpose, and its comment explaining why
is true for visitors and false for the dashboard. Hence two shapes, mapped side by
side in `vehicle-mapper.ts`.

### `revalidatePath` after every write

The homepage, `/cars` and each detail page are prerendered with a 5-minute window.
Without `revalidateStock()`, a car marked sold stays on the site for up to five
minutes. `revalidatePath("/cars/[id]", "page")` covers every id, including one
that was just created and has no prerendered page to target.

### Marketing chrome is hidden on `/admin` by a client guard

`HideOnAdmin` wraps the header, footer and structured data in the root layout and
returns null under `/admin`. The tidier-sounding alternative — a `(site)` route
group with a second root layout — means relocating eight verified page
directories and putting the styled 404, which two harnesses assert on, at the
mercy of a layout change. Revisit only if the admin ever needs its own `<html>`.

Note that a `curl | grep` cannot verify this: the hidden children still travel in
the inline RSC payload, so they appear in the page *source*. Only a real DOM
distinguishes them — that is what `qa/probe-admin-chrome.mjs` does.

### Colour in the admin

The two-accent rule is a *customer-facing* rule: on public pages blue means the
buying path and red means the selling path. Inside `/admin` there is no buying or
selling, so the mapping is scoped rather than extended — `accent` is the primary
action, `signal` is destructive (delete). No visitor ever sees these controls.

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

- `accent-*` (sky blue, `#4cc2ff` at 400) — the **buying** path: primary CTAs,
  eyebrows, focus rings, icons.
- `signal-*` (red, `#c94438` at 500) — the **selling** path and attention: the
  Sell/Exchange section, the hero's Sell CTA, the Reserved status badge.

Blue = buying, red = selling. Putting red somewhere that isn't the selling path
or a genuine attention state makes the system meaningless.

**Name things after the token family, never the hue.** The accent has already
moved once (cobalt `#5fa0e8` -> sky `#4cc2ff`) and the base twice. Anything named
for a colour goes stale silently: `SectionHeading`'s prop values used to read
`"cobalt" | "signal"` and now read `"accent" | "signal"`. Do not reintroduce a
hue name into an identifier.

**Derived colours must move with the base.** Two surfaces do not read a token
directly — they are `ink-950` at some alpha, so they change whenever the base
does, and nothing will tell you:

| Surface | Value | Why it is fragile |
|---|---|---|
| Status badge scrim | `bg-ink-950/95` | composites over **white** → `#2f2f2f`; the alpha is asserted in `verify_theme.py` against that literal |
| Navbar capsule | `bg-ink-950/92` | composites over **bone-50** → `#353535`; `qa-nav.mjs` reads the alpha off the rendered class |

Both alphas had to be raised when the base went `#181b21` -> `#242424`: at 90%
and 85% respectively the lighter ink composited lighter, and the navbar links
fell to **4.46:1** against a 4.5 requirement. That is the failure mode — a
*lighter* base lowers the contrast of everything sitting on it, including the
things that look unrelated. Also literal, also needs hand-updating:
`themeColor` in `layout.tsx`, the three `rgba()` glows (Button, Wordmark,
MapPlaceholder), and every constant in `scripts/generate_brand_assets.py`.

**One exception, and it is deliberate: the navbar's current-page marker is
near-white, not the accent.** It is the only place where "current page" used to
be the accent (an underline) and now is not. On `/cars` the current pill sits a
few hundred pixels from the blue "Find a Car" button in the same capsule, and
both point at `/cars`; two blue pills read as a mistake. `bone-50` on `ink-950`
says "you are here" (14.9:1) while blue says "click me". Do not "restore" it to
the accent without asking.

**The sell CTAs are filled red, not outlined — the client asked for this twice.**
The hero's "Sell Your Car" and the `/cars` closing band's "Sell or exchange
yours" both use `variant="primarySignal"` (`bg-signal-500` + white text). The
hero therefore shows **two filled buttons side by side** (blue Browse, red
Sell). That is intentional. It looks like a hierarchy problem, and on a generic
site it would be one — do not "fix" it back to an outline without asking.
`qa/qa-inventory.mjs` asserts the hero button's computed background is
`rgb(201, 68, 56)` and its label is white, so a revert fails the suite.
`outlineSignal` still exists for the case where a signal action must sit
*subordinate* to an accent primary; it currently has no usages.

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

- **The capsule carries a 92% `ink-950` scrim** (`bg-ink-950/92`), not the
  demo's `bg-white/6`. The demo sits on a permanently dark page; this site
  alternates. Over a `bone-50` band the demo's version measures **1.00:1** — the
  capsule and its labels both vanish. The alpha is part of the palette, not a
  free styling choice — see "Derived colours" under Design rules.
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
python scripts/verify_schema.py   # 10 checks: types, columns, and the bucket name
```

Then, against a running production build:

```bash
npm run build && npm run start
node qa/qa-nav.mjs       http://localhost:3000   # 62 assertions
node --env-file=.env.local qa/qa-inventory.mjs http://localhost:3000   # 47 assertions
node qa/qa-detail.mjs    http://localhost:3000   # 62 assertions
node qa/qa-sell.mjs      http://localhost:3000   # 123 assertions
node qa/qa-focus-ring.mjs http://localhost:3000  # 18 assertions — 8 pages × 2 viewports + self-test
node qa/qa-admin.mjs     http://localhost:3000   # 29 assertions
node qa/probe-admin-chrome.mjs http://localhost:3000   # 13 assertions
node qa/probe-viewtransition.mjs http://localhost:3000   # 10 assertions

# The signed-in half. Needs an account — see below.
# Add QA_ADMIN_EMAIL / QA_ADMIN_PASSWORD to .env.local first.
node --env-file=.env.local qa/qa-admin-authenticated.mjs http://localhost:3000
```

**`qa-inventory.mjs` needs `--env-file=.env.local`** because it reads the live stock
to derive its expected counts. It used to hard-code them — "14 cars total, 10
buyable, Toyota 3, SUV 5" — which was fine while the dataset was frozen and broke
the moment the client added a car through the dashboard: 24 checks went red and
every one was the harness being out of date, not the site being wrong. A suite that
fails when someone uses the product is worse than no suite, because the next real
failure arrives buried in noise. The predicates are written out in the harness
rather than imported from `src/lib/facets.ts` on purpose — re-importing the app's
own filter engine would compare the app to itself. `qa-detail.mjs` had the same
literal-count problem and now reads the expected number from the toolbar.

**`qa-focus-ring.mjs` is the guard for a whole class of bug.** The ring in
`globals.css` is drawn 5px outside the control's border box, so any ancestor with
`overflow` other than `visible` clips it — and `overflow-y: auto` alone is enough,
because CSS forces the other axis to `auto`. It tabs through eight pages at two
viewports and fails if any ring is cut. **It must tab, not read geometry up front:**
the ring only applies under `:focus-visible`, so an unfocused element reports
`outline-style: none` and `outline-width: 0`. The first version of this harness
did exactly that, computed a reach of zero for every element, skipped them all and
reported 16/16 while the `/cars` keyword field was visibly clipped.

**On the right the padding box is not the boundary — the scrollbar is.** Padding the
`/cars` content 8px clear of the padding box fixed the left side and still left the
ring 12px *under* the scrollbar: Windows Edge/Chrome draw an **overlay** scrollbar,
which reports `offsetWidth - clientWidth === 0` (no layout space) yet floats over
the last 15px of the scrollport. The harness therefore measures clearance against
`paddingBoxRight − scrollbarWidth`, and measures that width by temporarily forcing
`scrollbar-gutter: stable` when the direct subtraction comes back 0. The sidebar
itself now carries `scrollbar-gutter: stable`, which stops the bar overlaying
content and makes the column width identical on overlay and classic scrollbars.
**The usable rule is `gap = paddingRight − 5px`.**

**The harness self-tests, and any new negative assertion should too.** It reverts the
`/cars` sidebar to the pre-fix style in-page and asserts the check reports a cut. A
suite made of "nothing is wrong" assertions has to demonstrate it can go red, or its
green means nothing — this project has shipped several checks that passed while the
bug was visible on screen, including two earlier versions of this very harness. If you
cannot name the input that would make a check fail, it is decoration.

Every harness prints `N/N checks passed.` Counts quoted here are the ones the
harnesses actually emit. `qa-sell.mjs` did not print a total until Phase 6, so the
"123" it had been credited with was unverifiable — most checks run inside
per-viewport and per-vehicle loops, so counting `check(` calls in the source gives
a much smaller number. If you add a harness, make it print its own total.

**`qa-admin.mjs` needs no credentials.** It verifies that every `/admin` route
redirects a signed-out visitor, that `next` cannot be pointed at another origin
(asserted against the hidden field the page renders, which is what the action
receives), and that a genuinely rejected sign-in produces one message that says
nothing about whether the account exists. The last of those exercises the real
action against the real Supabase Auth endpoint, so it is a true end-to-end test of
the error path.

**`qa-admin-authenticated.mjs` covers the other half** — the signed-in dashboard,
which needs an account and therefore cannot run unattended. It walks one car
through its whole life (`qa-roundtrip-test-car`) and re-reads the public site after
every step: add → appears on `/cars` → edit the price → the public page updates →
unpublish → gone from the site but **still in the dashboard** → publish → back →
mark sold → delete → gone from both → sign out.

**The unpublish step is the one that earns its keep.** It is the only check
anywhere that can detect `0002_admin_access.sql` not having been run: `0001`'s
select policy is `using (published = true)` with no `to` clause, so it applies to
`authenticated` too, and an admin can write a draft they cannot read back. The
symptom is a car that vanishes from the dashboard the moment it is unpublished,
which looks exactly like deletion. So that step asserts on the dashboard list as
well as on the site.

It creates a real row in the real database and a real object in the real bucket,
and deletes the row at the end. **The photo is deliberately left in Storage**,
because that is what the app itself does — the test does not paper over the
behaviour it is meant to observe.

**Use a throwaway account, not the client's.** Every write policy is
`to authenticated`, so any account exercises exactly the same code path; a
temporary user created with *Auto Confirm User* ticked and deleted afterwards is
strictly better than handing over the real password. Ticking that box matters:
without it the account exists but cannot sign in, and the app reports that as a
generic credential failure, which reads as "wrong password".


**`probe-admin-chrome.mjs` exists because `curl | grep` cannot answer its
question.** The chrome hidden on `/admin` is still present in the page *source*,
inside the inline RSC payload, so grepping for it reports a leak that is not there.
Only a real DOM distinguishes "in the payload" from "on the page".

The harnesses drive real Microsoft Edge via `playwright-core`
(`channel: 'msedge'`) and assert what a screenshot cannot. `qa-nav.mjs` covers the
site-wide header — the capsule's contrast over a light band, the sticky toolbar
clearing it, the disclosure menu's keyboard behaviour, and where a nav click
leaves the scroll position. `qa-inventory.mjs`
covers URL-driven filtering and the mobile filter sheet; `qa-detail.mjs` covers
the 14 vehicle pages. **Prefer extending an existing harness to adding a new one** —
one file per surface, each with a header comment saying what it covers. `/admin` got
its own because it is a genuinely separate surface with its own failure mode: the
question it answers is "can the wrong person get in", which no page harness asks.

**Wait for `"load"`, never `"networkidle"`.** These harnesses used to navigate with
`waitUntil: "networkidle"` and would hang for the full 30s timeout, intermittently, on
whichever navigation came second. The cause is Next's prefetching: every page prefetches the
homepage from the logo and breadcrumb, and those `/?_rsc=…` requests never register as
finished, so `networkidle` waits forever. **It reproduces on `/about`, which the Supabase swap
never touched**, so it is not a data-layer problem — and it is not fixed by disabling
`next/image` optimisation, which was tried and made no difference. `"load"` waits for the
page's own resources, which is what these assertions actually need, and Playwright's locator
auto-waiting covers the rest. Playwright documents `networkidle` as discouraged for exactly
this reason. Seven one-off `probe-*.mjs` diagnostics still use it; leave them alone unless
they start hanging too.

`qa-sell.mjs` also owns the **site-wide link scan**. It crawls every page, gathers
each distinct internal `href`, requests it, and fails on any 404. It is the reason
the four dead routes could not be forgotten; keep it at zero. It also covers the
four supporting pages and the sell form across **six viewports each** — one `<h1>`,
no skipped heading levels, alt text, a real meta description, valid JSON-LD, the
honesty notices, and no horizontal overflow. A page that merely returns 200 fails
those, which is the point.

### The supporting pages

`/about`, `/contact`, `/privacy` and `/terms` were built after Phase 4 because
they were linked from every page and all four 404ed. Three things to know:

- `/privacy` and `/terms` were **written from what the codebase actually does** —
  the privacy page says there are no accounts, no cookies, no analytics and no
  `localStorage` because a grep of `src/` confirms there are none. If a tracker is
  ever added, that page becomes wrong and must be updated in the same commit.
- Both render through one shared shell, `src/components/legal/LegalDocument.tsx`,
  and both carry a visible "starting point, not legal advice" notice.
- `/contact` reuses `src/components/ui/MapPlaceholder.tsx`, which was extracted
  from `LocationContact.tsx` so the homepage and the contact page show one map,
  not two copies that can drift.

### The sell flow (Phase 4)

`/sell-your-car` is the one page where the signal red carries the whole
surface rather than marking a section — it is the selling path end to end, so
the eyebrow, the step numbers and the primary action are all red. This is why
`SectionHeading` grew an `accent` prop; without it the eyebrow was hardcoded
to the blue and the page read as browsing.

**There is no backend until Phase 5, so the form does not POST anywhere.**
`ValuationForm` composes a WhatsApp message from what the visitor typed, opens
`wa.me` from the submit handler, and shows a panel saying plainly that
**nothing is sent until they press send in WhatsApp**. That honesty is load
bearing: a form that looks like it submitted when it did not is worse than no
form. `qa/qa-sell.mjs` asserts the confirmation never claims the details were
sent, and that an invalid submit opens no window at all.

Message composition lives in `sellVehicleMessage()` in `src/lib/whatsapp.ts`,
not in the component — it sits with every other message the site sends, and it
can be checked without rendering anything.

Two smaller things worth keeping:

- **Field names are plain (`name="make"`), ids are not.** `useId()` returns
  characters such as `«` and `»`, which are not valid inside a CSS attribute
  selector. Focus-the-first-error therefore reads `data-field`, which is on the
  control from first render — an `[aria-invalid]` lookup would run *before*
  React re-renders and find nothing. Plain `name` also lets browser autofill
  recognise the name and phone inputs.
- **The FAQ is native `<details>`/`<summary>`.** No JavaScript, keyboard
  operable for free, announced correctly. The `FAQPage` JSON-LD mirrors the
  rendered questions exactly; a mismatch between the two is what gets a site
  penalised, and `qa/qa-sell.mjs` compares them element by element.

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
  the bright sky in the Prado photo. They now carry a 95% `ink-950` scrim, which
  composites to `#2f2f2f` over a white pixel and clears 4.5:1 for all three
  labels. Checked in `verify_theme.py` (analytically) and
  `qa/measure-badge.mjs` + `scripts/measure_badge_contrast.py` (from the rendered
  pixels). If you add another badge over a photo, give it a scrim too.
  **The alpha moved 90% -> 95% when the base lightened** — the scrim is a derived
  colour, so it is not independent of `ink-950`.
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
