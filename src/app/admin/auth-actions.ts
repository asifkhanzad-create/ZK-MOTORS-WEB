"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase-server";

/**
 * Sign-in and sign-out.
 *
 * Both are Server Actions, so the session is established and torn down with
 * cookies written on the server. The password never reaches a client-side
 * Supabase client and no auth key is exposed to the browser.
 */

export type SignInState = { error: string | null };

/**
 * Only ever redirect to somewhere inside the admin area.
 *
 * `next` arrives from the query string, so without this check a crafted link
 * could sign an admin in and then bounce them to another origin — a convincing
 * phishing setup, since the redirect happens immediately after a real login.
 * Anything that is not an `/admin` path is discarded.
 */
function safeNext(value: string) {
  if (value === "/admin") return value;
  return value.startsWith("/admin/") ? value : "/admin";
}

export async function signIn(
  _previous: SignInState,
  formData: FormData,
): Promise<SignInState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = safeNext(String(formData.get("next") ?? ""));

  if (!email || !password) {
    return { error: "Enter your email and password." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    /* Deliberately one message for every credential failure. Telling the visitor
       apart "no such account" from "wrong password" is a free account-enumeration
       oracle, and this is the only door into the stock database.
       The real reason is logged so the operator can diagnose it. */
    console.error("[admin] sign-in rejected:", error.message);

    const rateLimited =
      error.status === 429 || /rate limit|too many/i.test(error.message);

    return {
      error: rateLimited
        ? "Too many attempts. Wait a minute and try again."
        : "Those details were not accepted.",
    };
  }

  /* Clear any cached admin render so the dashboard is fetched fresh for this
     session rather than reusing a payload built for nobody. */
  revalidatePath("/admin", "layout");

  /* Outside any try/catch on purpose: `redirect()` works by throwing, and a
     catch here would swallow the navigation and leave a blank screen. */
  redirect(next);
}

export async function signOut() {
  const supabase = await createSupabaseServerClient();

  /* Revokes the refresh token at Supabase as well as clearing the cookies, so a
     copied cookie cannot be replayed after signing out. */
  const { error } = await supabase.auth.signOut();
  if (error) console.error("[admin] sign-out failed:", error.message);

  revalidatePath("/admin", "layout");
  redirect("/admin/login");
}
