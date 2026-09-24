-- ===========================================================================
-- optional_admin_email_lock.sql
-- ===========================================================================
-- OPTIONAL HARDENING — read this whole header before running it.
--
-- ## The problem it solves
--
-- Every policy in 0001 and 0002 is granted `to authenticated`, which means *any*
-- signed-in user. That is fine as long as the only accounts that exist are the
-- ones you created by hand. It stops being fine the moment "Allow new users to
-- sign up" is switched on in Authentication -> Providers -> Email: from then on
-- anyone who finds the project URL can create an account and gain full write
-- access to your stock. The public key is in the page source, so the project URL
-- is not a secret.
--
-- **The first line of defence is that setting.** Turn sign-ups off and the hole
-- closes. This file is the second line: it makes the data itself refuse anyone
-- whose email is not on the list, so the setting no longer matters.
--
-- ## Before you run this
--
--   1. Replace BOTH occurrences of `owner@example.com` below with the email
--      address of the account you sign in with.
--   2. Make sure that account exists and you know its password.
--
-- If you run it with the placeholder still in place, nobody can write anything
-- and the dashboard will fail on every save. To undo, re-run
-- `0002_admin_access.sql` — it drops and recreates the same policies without the
-- email check.
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- The check, in one place
-- ---------------------------------------------------------------------------
-- Reads the email from the JWT that Supabase has already verified. `auth.jwt()`
-- returns the claims of the *presented* token, so this is not something a client
-- can spoof by editing a cookie.
-- ---------------------------------------------------------------------------

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select coalesce(auth.jwt() ->> 'email', '') = any (
    array[
      'owner@example.com'   -- <<< REPLACE THIS with your admin email
    ]
  );
$$;

comment on function public.is_admin() is
  'True when the signed-in user''s verified email is on the admin list. '
  'Gates every write policy on public.vehicles and storage.objects.';

-- ---------------------------------------------------------------------------
-- Vehicles: read drafts, and write, only for that address
-- ---------------------------------------------------------------------------

drop policy if exists "admins read all stock" on public.vehicles;
create policy "admins read all stock"
  on public.vehicles
  for select
  to authenticated
  using (public.is_admin());

drop policy if exists "admins insert stock" on public.vehicles;
create policy "admins insert stock"
  on public.vehicles
  for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists "admins update stock" on public.vehicles;
create policy "admins update stock"
  on public.vehicles
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "admins delete stock" on public.vehicles;
create policy "admins delete stock"
  on public.vehicles
  for delete
  to authenticated
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- Storage: same gate on the photo bucket
-- ---------------------------------------------------------------------------

drop policy if exists "admins upload vehicle photos" on storage.objects;
create policy "admins upload vehicle photos"
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'vehicle-photos' and public.is_admin());

drop policy if exists "admins replace vehicle photos" on storage.objects;
create policy "admins replace vehicle photos"
  on storage.objects
  for update
  to authenticated
  using (bucket_id = 'vehicle-photos' and public.is_admin())
  with check (bucket_id = 'vehicle-photos' and public.is_admin());

drop policy if exists "admins delete vehicle photos" on storage.objects;
create policy "admins delete vehicle photos"
  on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'vehicle-photos' and public.is_admin());

-- ===========================================================================
-- To add a second admin later, add their address to the array in
-- `public.is_admin()` and re-run just that `create or replace function` block.
-- ===========================================================================
