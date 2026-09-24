import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

/**
 * Read-only Supabase client for public data.
 *
 * Authenticated with the publishable key, which is public by design and ships
 * to the browser. Everything it can reach is therefore governed by row-level
 * security — the policies in `0001_vehicles.sql` allow reads of published stock
 * and nothing else. Verified on 2026-09-23: an anonymous INSERT is rejected
 * with `42501`.
 *
 * This is deliberately NOT the service-role client. That key bypasses RLS
 * entirely and must never be reachable from anything the browser can run. When
 * Phase 6 needs to write, it gets its own client in a server action.
 *
 * Server-side only in practice: every read happens in a server component or a
 * route handler. The key being public means importing this from a client
 * component would not leak anything, but it would move data fetching into the
 * browser, which is the one thing the Phase 2 filter design avoids.
 */

let cached: SupabaseClient<Database> | null = null;

export function getSupabase(): SupabaseClient<Database> {
  if (cached) return cached;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    /* Thrown rather than logged: a missing key means every vehicle query fails,
       and a build or request that fails loudly here is far easier to diagnose
       than an inventory page that silently renders nothing. */
    throw new Error(
      "Supabase is not configured. Copy .env.example to .env.local and set " +
        "NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY. On Vercel, " +
        "set both in Project Settings -> Environment Variables.",
    );
  }

  cached = createClient<Database>(url, key, {
    auth: {
      /* No session is ever established on a public page, so there is nothing to
         persist — and persisting would mean writing to localStorage, which the
         privacy policy says the site does not do. Turning both off keeps that
         page honest. Revisit if a public page ever needs a signed-in visitor. */
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });

  return cached;
}
