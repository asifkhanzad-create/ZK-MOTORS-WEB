import type { Metadata } from "next";
import Link from "next/link";

import { siteConfig } from "@/config/site";

import { LoginForm } from "./LoginForm";

/**
 * Sign-in for the stock dashboard.
 *
 * `noindex, nofollow` and `force-dynamic`: this page must never be prerendered
 * or cached, and it must never appear in a search result. The root layout's
 * `robots` says `index, follow` for the marketing site, so this override is what
 * keeps /admin out of the index.
 */
export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false, nocache: true },
};

export const dynamic = "force-dynamic";

/**
 * Validate `next` here as well as in the action.
 *
 * The proxy puts the original destination in the query string. The action checks
 * it again before redirecting, so this is the second of two checks — worth
 * having, because the value is rendered into the page and a bad one would be a
 * visible open-redirect target.
 */
function safeNext(value: string | string[] | undefined) {
  if (typeof value !== "string") return "/admin";
  if (value === "/admin") return value;
  return value.startsWith("/admin/") ? value : "/admin";
}

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { next } = await searchParams;

  return (
    <div className="flex min-h-dvh items-center justify-center bg-bone-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col gap-1.5">
          <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-muted-light">
            {siteConfig.name}
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-ink-950">Stock dashboard</h1>
          <p className="text-sm leading-relaxed text-muted-light">
            Staff sign-in. Visitors do not need an account to browse the cars.
          </p>
        </div>

        <div className="rounded-card border border-bone-200 bg-white p-5 shadow-[0_18px_40px_-28px_rgba(10,11,13,0.35)] sm:p-7">
          <LoginForm next={safeNext(next)} />
        </div>

        <p className="mt-5 text-center text-sm text-muted-light">
          <Link
            href="/"
            className="font-medium text-ink-900 underline decoration-ink-400 underline-offset-2 transition-colors hover:text-accent-600"
          >
            Back to the website
          </Link>
        </p>
      </div>
    </div>
  );
}
