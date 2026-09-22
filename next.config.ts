import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    /* All current imagery is local; no remote hosts needed yet. */
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
