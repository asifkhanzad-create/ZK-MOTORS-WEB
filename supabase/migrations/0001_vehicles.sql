-- ============================================================================
-- 0001 — vehicles
--
-- The single table Phase 5 introduces. It replaces the `vehicles` array in
-- src/data/vehicles.ts. Every column maps 1:1 onto the `Vehicle` type in
-- src/types/vehicle.ts, which was written with this shape in mind.
--
-- Run against a fresh Supabase project, either with the CLI (project linked):
--     supabase db push
-- or by pasting this file's CONTENTS into the SQL editor in the dashboard.
-- Note the distinction: the editor executes SQL *text*. Pasting the path
-- ("supabase/migrations/0001_vehicles.sql") is a 42601 syntax error.
--
-- EXECUTED SUCCESSFULLY against the real project on 2026-09-23 — "Success. No
-- rows returned", 21 columns, 4 policies, 0 rows. Nothing in the app reads this
-- table yet; the data layer still points at src/data/vehicles.ts until the
-- swap, so the site is unaffected by this migration having run.
-- ============================================================================

create table if not exists public.vehicles (
  -- The slug, and the detail-page URL. Kept as the primary key rather than
  -- adding a surrogate uuid so that /cars/toyota-corolla-altis-grande-2021
  -- stays stable and needs no lookup column. Generate it in the admin from
  -- make + model + variant + year, and make it unique by construction.
  id                text        primary key,

  make              text        not null,
  model             text        not null,
  variant           text,
  year              smallint    not null,

  -- Whole rupees, no decimals — matches `formatPKR` and the existing type.
  -- integer tops out at ~2.1 billion, so even a 100M Land Cruiser fits. If
  -- paisa is ever needed, this becomes bigint.
  price             integer     not null,

  mileage           integer     not null,

  -- text + CHECK rather than a Postgres enum: an enum cannot have a value
  -- removed, and adding one needs an ALTER TYPE migration. These checks mirror
  -- the TypeScript unions in src/types/vehicle.ts — if you add a body type,
  -- change both, and this constraint is what will tell you that you forgot.
  transmission      text        not null
                                check (transmission in ('Automatic', 'Manual')),
  fuel              text        not null
                                check (fuel in ('Petrol', 'Diesel', 'Hybrid', 'Electric')),
  body_type         text        not null
                                check (body_type in ('Sedan', 'Hatchback', 'SUV', 'Crossover', 'Pickup')),

  registration_city text        not null,

  status            text        not null default 'available'
                                check (status in ('available', 'reserved', 'sold')),

  -- With photos in Supabase Storage this is a full public URL; it was a
  -- /public path before Phase 5.
  image             text        not null,

  -- Deliberately NOT NULL. The QA suite asserts every image has alt text, so
  -- a nullable column would let a car be created that fails that check at
  -- render time instead of at insert time.
  image_alt         text        not null,

  highlight         text,
  description       text,

  -- Extra photos. The detail gallery already renders a thumbnail rail once
  -- this has entries; it has never run, because every placeholder listing has
  -- exactly one photo.
  gallery           text[]      not null default '{}',

  featured          boolean     not null default false,

  -- Draft/publish. A car is invisible until this is true, so the admin can
  -- enter one over several sittings. This is what the public read policy keys
  -- off. It is NOT the same as `status`: `sold` cars stay published on purpose,
  -- because the homepage's "Recently sold" section depends on reading them.
  published         boolean     not null default false,

  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

comment on table public.vehicles is
  'Stock listings. Replaces the placeholder array in src/data/vehicles.ts (Phase 5).';
comment on column public.vehicles.published is
  'Draft flag. Public read policy requires true. Sold cars stay true — RecentlySold reads them.';

-- ---------------------------------------------------------------------------
-- updated_at
-- ---------------------------------------------------------------------------

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists vehicles_touch_updated_at on public.vehicles;
create trigger vehicles_touch_updated_at
  before update on public.vehicles
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Row-level security
--
-- Reads are public but only for published rows. Writes are for signed-in admins
-- only — the Phase 6 dashboard uses Supabase Auth (email + password), so the
-- `authenticated` role is the right gate. An anonymous visitor can neither read
-- a draft nor modify anything, even if the anon key leaks; that key is public
-- by design and RLS is the only thing standing behind it.
-- ---------------------------------------------------------------------------

alter table public.vehicles enable row level security;

drop policy if exists "anyone reads published stock" on public.vehicles;
create policy "anyone reads published stock"
  on public.vehicles
  for select
  using (published = true);

drop policy if exists "admins insert stock" on public.vehicles;
create policy "admins insert stock"
  on public.vehicles
  for insert
  to authenticated
  with check (true);

drop policy if exists "admins update stock" on public.vehicles;
create policy "admins update stock"
  on public.vehicles
  for update
  to authenticated
  using (true)
  with check (true);

drop policy if exists "admins delete stock" on public.vehicles;
create policy "admins delete stock"
  on public.vehicles
  for delete
  to authenticated
  using (true);

-- ---------------------------------------------------------------------------
-- Index
--
-- Every public read is filtered by `published = true`, so a partial index keeps
-- the scan off the draft rows. Small table today; free to add now.
-- ---------------------------------------------------------------------------

create index if not exists vehicles_published_idx
  on public.vehicles (published)
  where published = true;
