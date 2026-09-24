import type { Metadata } from "next";
import Link from "next/link";

import { signOut } from "@/app/admin/auth-actions";
import { buttonClasses } from "@/components/ui/Button";

import { requireAdmin } from "@/lib/auth";

/**
 * The shell for every signed-in admin page.
 *
 * This lives in a `(dashboard)` route group so that `/admin/login` sits *outside*
 * it. A layout that enforces auth cannot wrap the login page — `requireAdmin()`
 * would redirect to the page that is already rendering, and the browser would
 * loop until it gave up. Route groups do not appear in the URL, so `/admin`,
 * `/admin/cars/new` and `/admin/cars/[id]` all keep the paths they should have.
 *
 * `requireAdmin()` here is the gate for the whole group: it runs before any child
 * page renders, and it throws, so nothing below can execute for a signed-out
 * visitor. Pages and actions check again anyway — a layout is not a security
 * boundary, since a Server Action can be invoked without rendering one.
 */
export const metadata: Metadata = {
  title: "Stock",
  robots: { index: false, follow: false, nocache: true },
};

/**
 * Belt and braces. `requireAdmin()` reads cookies, which already opts every page
 * below into dynamic rendering, but an admin page that was ever prerendered or
 * cached would be served to the wrong person. This states the requirement rather
 * than relying on a side effect of reading a cookie.
 */
export const dynamic = "force-dynamic";

export default async function AdminDashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const admin = await requireAdmin();

  return (
    <div className="min-h-dvh bg-bone-50">
      <header className="sticky top-0 z-40 border-b border-bone-200 bg-white">
        <div className="mx-auto flex w-full max-w-6xl items-center gap-4 px-4 py-3">
          <Link
            href="/admin"
            className="flex items-baseline gap-2.5 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-500"
          >
            <span className="text-sm font-bold tracking-tight text-ink-950">ZK Motors</span>
            <span className="text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-muted-light">
              Stock
            </span>
          </Link>

          <div className="ml-auto flex items-center gap-3">
            {/* Shown so a second, unexpected account is noticeable. Row-level
                security grants every signed-in user full write access, so the
                only thing limiting who can edit stock is which accounts exist —
                see the sign-up setting in AGENTS.md. */}
            {admin.email ? (
              <span
                className="hidden max-w-[18ch] truncate text-xs text-muted-light sm:inline"
                title={admin.email}
              >
                {admin.email}
              </span>
            ) : null}

            {/* A plain form posting a Server Action: signing out works without
                JavaScript, which matters on the tablet this will be used from. */}
            <form action={signOut}>
              <button
                type="submit"
                className={buttonClasses({ variant: "outlineLight", size: "sm" })}
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* A div, not a <main>: the root layout already renders the page's single
          <main id="main">, and a second one inside it is invalid HTML. */}
      <div className="mx-auto w-full max-w-6xl px-4 py-8">{children}</div>
    </div>
  );
}
