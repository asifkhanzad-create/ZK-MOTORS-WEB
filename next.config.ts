import type { NextConfig } from "next";

/**
 * Supabase Storage hostname, derived from the env var rather than hard-coded.
 *
 * `next/image` refuses to optimise an image from a host it has not been told
 * about, so the Storage hostname has to appear in `remotePatterns`. Writing the
 * project ref as a literal here would mean that pointing the site at a different
 * Supabase project silently breaks every vehicle photo — and it would be a
 * second place the project ref lives, next to `.env.local`.
 *
 * If the env var is missing the pattern is simply omitted, and the warning below
 * says so at build time. That is a loud failure rather than a silent one.
 */
function supabaseHostname(): string | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) return null;
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

const storageHost = supabaseHostname();

if (!storageHost) {
  console.warn(
    "[next.config] NEXT_PUBLIC_SUPABASE_URL is not set — vehicle photos hosted " +
      "in Supabase Storage will not be optimised by next/image. Check .env.local.",
  );
}

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: {
    serverActions: {
      /**
       * Server Actions cap the request body at **1MB by default**, which is the
       * single most likely reason a photo upload silently fails: the admin form
       * posts the image through a Server Action, and a phone photo is several
       * megabytes. Next rejects the request before the action ever runs, so the
       * error looks nothing like "the file is too big".
       *
       * The limit is on the raw body, multipart boundaries and part headers
       * included — roughly 10-20KB of overhead on top of the file itself. This
       * sits above the 10MB per-file check in `vehicle-actions.ts` so the
       * app's own validation is what rejects an oversized photo, with a message
       * naming the limit, rather than Next's generic 413.
       */
      bodySizeLimit: "12mb",
    },
  },
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: storageHost
      ? [
          {
            protocol: "https",
            hostname: storageHost,
            /* Public objects only. A private object needs a signed URL, which
               carries a token in the query string and is not cacheable this
               way — if that ever becomes necessary, revisit this. */
            pathname: "/storage/v1/object/public/**",
          },
        ]
      : [],
  },
};

export default nextConfig;
