import type { MetadataRoute } from "next";

import { siteUrl } from "@/config/site";

/**
 * Only routes that actually exist are listed. Vehicle detail pages and the
 * remaining static pages get appended here as each phase ships — a sitemap
 * pointing at 404s is worse than a short one.
 *
 * Filtered inventory URLs (`/cars?make=Toyota`) are deliberately excluded:
 * they all canonicalise to `/cars`, so listing them would just be duplicate
 * content.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return [
    {
      url: siteUrl,
      lastModified,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${siteUrl}/cars`,
      lastModified,
      changeFrequency: "daily",
      priority: 0.9,
    },
  ];
}
