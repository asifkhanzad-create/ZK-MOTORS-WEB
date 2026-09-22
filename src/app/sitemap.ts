import type { MetadataRoute } from "next";

import { siteUrl } from "@/config/site";
import { vehicles } from "@/data/vehicles";

/**
 * Only routes that actually exist are listed. The remaining static pages get
 * appended here as each phase ships — a sitemap pointing at 404s is worse than
 * a short one.
 *
 * Filtered inventory URLs (`/cars?make=Toyota`) are deliberately excluded:
 * they all canonicalise to `/cars`, so listing them would just be duplicate
 * content.
 *
 * Sold cars ARE included. Their pages are real, useful pages — they show what
 * has moved through the lot — and each one carries `SoldOut` availability in
 * its structured data, so a search engine is told plainly that the car is gone.
 * Drop them from this list if the client would rather not rank for them.
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
    ...vehicles.map((vehicle) => ({
      url: `${siteUrl}/cars/${vehicle.id}`,
      lastModified,
      changeFrequency: "weekly" as const,
      priority: vehicle.status === "sold" ? 0.5 : 0.8,
    })),
  ];
}
