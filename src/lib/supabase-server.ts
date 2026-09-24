import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import type { Database } from "@/types/database";

/**
 * Cookie-backed Supabase client, for the admin area only.
 *
 * Two things make this different from `getSupabase()` in `./supabase.ts`:
 *
 *   1. **It carries the signed-in user's session**, read from the request
 *      cookies. Writes therefore run as that user, so the `to authenticated`
 *      policies in `0001_vehicles.sql` are the thing actually guarding the
 *      table. No service-role key exists anywhere in this project, so there is
 *      no code path that bypasses row-level security.
 *   2. **It is created per request, never cached.** `getSupabase()` memoises a
 *      single client in a module variable, which is safe for anonymous reads
 *      and catastrophic here — a cached authenticated client would serve one
 *      admin's session to the next visitor. Do not add a cache to this file.
 *
 * A new client per request also means no stale token: the session is read from
 * the cookie the browser just sent.
 */
export async function createSupabaseServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      "Supabase is not configured. Copy .env.example to .env.local and set " +
        "NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY. On Vercel, " +
        "set both in Project Settings -> Environment Variables.",
    );
  }

  /* `cookies()` is async in Next 15+; awaiting it is required, not optional. */
  const cookieStore = await cookies();

  return createServerClient<Database>(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          /* Thrown when this runs inside a Server Component, where cookies are
             read-only. Safe to swallow: `src/proxy.ts` refreshes the session and
             writes the cookies on the response instead. Without that proxy this
             catch would silently log the admin out on every page load. */
        }
      },
    },
  });
}
