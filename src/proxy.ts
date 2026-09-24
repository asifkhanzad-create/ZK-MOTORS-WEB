import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Session refresh and a first-pass gate for `/admin`.
 *
 * Next.js 16 renamed the `middleware` file convention to `proxy` — the file is
 * `src/proxy.ts` and the exported function is `proxy`. A `middleware.ts` here
 * would simply never run, which looks exactly like "auth is broken" rather than
 * "the file is named wrong".
 *
 * **This is not the security boundary.** It exists for two reasons:
 *
 *   1. Server Components cannot write cookies, so something has to take the
 *      refreshed token and put it on the response. Without that, the admin is
 *      signed out at random. That is `getClaims()`'s side effect here.
 *   2. It turns "signed out" into a redirect rather than a flash of the login
 *      page inside the dashboard chrome.
 *
 * The real check is `requireAdmin()` in `src/lib/auth.ts`, called by every admin
 * page and every Server Action. A Server Action can be POSTed to directly,
 * without ever passing through this file.
 *
 * **The matcher is deliberately narrow.** Running this on public routes would
 * call `getClaims()` on pages that are prerendered and ISR-cached, and a cached
 * response carrying `Set-Cookie` can hand one visitor another visitor's session.
 * Public pages never touch auth; only `/admin` does.
 */
export const config = {
  matcher: ["/admin/:path*"],
};

const LOGIN_PATH = "/admin/login";

/**
 * Move the refreshed session cookies onto a different response.
 *
 * When the session is renewed, the new cookies are written onto `response`. If
 * we then return a *redirect* built from scratch, those cookies are dropped and
 * the redirect throws away the very session it just renewed — the admin signs in
 * and is immediately signed out again. Copy them across.
 *
 * `ResponseCookies.set()` takes a whole cookie object, so passing the results of
 * `getAll()` straight back in preserves name, value and every option.
 */
function carrySession(target: NextResponse, source: NextResponse) {
  source.cookies.getAll().forEach((cookie) => target.cookies.set(cookie));
  /* Per-user responses must never sit in a shared cache. */
  target.headers.set("Cache-Control", "no-store");
  return target;
}

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  /* No config, no session to refresh. Falling through hands the request to the
     page, whose `requireAdmin()` throws a message naming the missing variables —
     far more useful than a 500 raised in here, and it still leaks nothing. */
  if (!url || !key) return response;

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        /* Write to the request first so anything downstream sees the new token,
           then rebuild the response so the browser gets it too. */
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
        Object.entries(headers).forEach(([header, value]) =>
          response.headers.set(header, value),
        );
      },
    },
  });

  /* Nothing may run between creating the client and this call — the docs are
     explicit that interleaving work here is what causes admins to be logged out
     at random. `getClaims()` is the only thing that both verifies the token and
     triggers a refresh when it is close to expiry. */
  const { data } = await supabase.auth.getClaims();
  const signedIn = Boolean(data?.claims);

  const onLoginPage = request.nextUrl.pathname === LOGIN_PATH;

  if (!signedIn && !onLoginPage) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = LOGIN_PATH;
    loginUrl.search = "";

    /* Carry where they were heading so signing in lands them there. Only ever a
       path starting with `/admin`, so the parameter cannot be used to bounce a
       freshly-authenticated admin off to another origin. */
    const intended = request.nextUrl.pathname + request.nextUrl.search;
    if (intended.startsWith("/admin/")) loginUrl.searchParams.set("next", intended);

    const redirect = NextResponse.redirect(loginUrl);
    return carrySession(redirect, response);
  }

  if (signedIn && onLoginPage) {
    const adminUrl = request.nextUrl.clone();
    adminUrl.pathname = "/admin";
    adminUrl.search = "";
    const redirect = NextResponse.redirect(adminUrl);
    return carrySession(redirect, response);
  }

  /* Admin pages are per-user and must never sit in a shared cache. The public
     site is ISR-cached on purpose; this is the opposite requirement. */
  response.headers.set("Cache-Control", "no-store");
  return response;
}
