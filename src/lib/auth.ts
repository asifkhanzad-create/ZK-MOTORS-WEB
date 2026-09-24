import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase-server";

/**
 * Who is signed in, if anyone.
 *
 * **`getClaims()`, never `getSession()`.** `getSession()` reads the session out
 * of the cookie and hands back the user object without checking it against
 * anything — and a cookie is just a string the visitor controls. Trusting it
 * means anyone can forge a session and be treated as an admin. `getClaims()`
 * verifies the token's signature before returning the claims, which is why it
 * is the only thing this file is allowed to call.
 *
 * This is also the real authorisation gate. `src/proxy.ts` redirects
 * unauthenticated visitors away from `/admin`, but a proxy is a routing
 * convenience, not a security boundary — a Server Action can be invoked without
 * navigating at all. So every page and every action calls in here.
 */
export type Admin = {
  id: string;
  email: string | null;
};

export async function getAdmin(): Promise<Admin | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims) return null;

  const { sub, email } = data.claims;
  if (typeof sub !== "string" || sub.length === 0) return null;

  return { id: sub, email: typeof email === "string" ? email : null };
}

/**
 * The same check, but it leaves the page when it fails.
 *
 * `redirect()` throws, so nothing after a call to this can run for a visitor who
 * is not signed in. Callers can treat the return value as a guarantee.
 */
export async function requireAdmin(): Promise<Admin> {
  const admin = await getAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}
