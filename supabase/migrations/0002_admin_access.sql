-- ===========================================================================
-- 0002_admin_access.sql
-- ===========================================================================
-- Run this AFTER 0001_vehicles.sql, in the Supabase SQL editor.
--
-- 0001 granted admins the ability to *write* stock but not to *read* drafts.
-- Its select policy is `using (published = true)` with no `to` clause, so it
-- applies to every role — including `authenticated`. Policies are permissive
-- and OR'd, and there is no second select policy, so a signed-in admin could
-- still only see published rows.
--
-- The symptom is confusing enough to be worth naming: unpublishing a car makes
-- it vanish from the dashboard as well as from the site, which looks exactly
-- like the car was deleted. Nothing is lost — the row is still there, and
-- publishing it from the Supabase table editor brings it back — but the
-- dashboard is unusable for drafts until this runs.
--
-- Everything here only ADDS permissions the dashboard needs. Nothing is
-- revoked and nothing is made stricter, so running it twice is safe.
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- 1. Admins can read every row, published or not
-- ---------------------------------------------------------------------------
-- This is what makes drafts visible in the dashboard. Visitors are unaffected:
-- they carry no session, so `authenticated` does not apply to them and the
-- published-only policy in 0001 remains their only route in.
-- ---------------------------------------------------------------------------

drop policy if exists "admins read all stock" on public.vehicles;
create policy "admins read all stock"
  on public.vehicles
  for select
  to authenticated
  using (true);

-- ---------------------------------------------------------------------------
-- 2. Admins can upload photos
-- ---------------------------------------------------------------------------
-- Every object in every bucket lives in `storage.objects`, so `bucket_id` is
-- what scopes these to this project's bucket rather than to Storage as a whole.
--
-- Reading needs no policy: the bucket is public, which is why the site can
-- serve the photos to anonymous visitors. Only writes are gated here.
--
-- The dashboard uploads with the signed-in admin's session, never with a
-- service-role key, so these policies are the thing actually guarding the
-- bucket.
-- ---------------------------------------------------------------------------

drop policy if exists "admins upload vehicle photos" on storage.objects;
create policy "admins upload vehicle photos"
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'vehicle-photos');

drop policy if exists "admins replace vehicle photos" on storage.objects;
create policy "admins replace vehicle photos"
  on storage.objects
  for update
  to authenticated
  using (bucket_id = 'vehicle-photos')
  with check (bucket_id = 'vehicle-photos');

-- The dashboard does not delete photos — removing a listing leaves its file in
-- place on purpose, since deleting an object is irreversible and an orphaned
-- file costs a few hundred kilobytes. This policy exists so a mistaken upload
-- can be cleaned up from the Supabase Storage browser without disabling
-- protection on the bucket.
drop policy if exists "admins delete vehicle photos" on storage.objects;
create policy "admins delete vehicle photos"
  on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'vehicle-photos');

-- ===========================================================================
-- Done. Confirm with:
--
--   select policyname, cmd, roles, qual
--   from pg_policies
--   where schemaname in ('public', 'storage')
--     and tablename in ('vehicles', 'objects')
--   order by tablename, cmd;
--
-- Expect six rows: three on `vehicles` (one select, plus the insert/update/
-- delete from 0001 — four in total including 0001's policies) and three on
-- `objects`. See `optional_admin_email_lock.sql` for the one further step that
-- makes the "Allow new users to sign up" setting irrelevant.
-- ===========================================================================
