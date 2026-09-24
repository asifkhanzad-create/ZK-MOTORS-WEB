import type { MetadataRoute } from "next";

import { siteUrl } from "@/config/site";
import { fetchVehicles } from "@/lib/vehicles-source";

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
 *
 * Vehicle entries come from the database, so a newly published car is
 * discoverable without a code change. If the read fails this throws rather than
 * emitting a sitemap missing every car — a partial sitemap that looks valid is
 * how pages quietly drop out of an index.
 */
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const lastModified = new Date();
  const vehicles = await fetchVehicles();

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
    /* Phase 4. Sits just under the inventory: it is a primary business action
       rather than a browsing page, but it is not the site's front door. */
    {
      url: `${siteUrl}/sell-your-car`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${siteUrl}/contact`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${siteUrl}/about`,
      lastModified,
      changeFrequency: "yearly",
      priority: 0.6,
    },
    /* The legal pair is listed but ranked last on purpose. They are pages a
       visitor should be able to find, not pages worth spending crawl budget
       on ahead of the inventory. */
    {
      url: `${siteUrl}/privacy`,
      lastModified,
      changeFrequency: "yearly",
      priority: 0.2,
    },
    {
      url: `${siteUrl}/terms`,
      lastModified,
      changeFrequency: "yearly",
      priority: 0.2,
    },
    ...vehicles.map((vehicle) => ({
      url: `${siteUrl}/cars/${vehicle.id}`,
      lastModified,
      changeFrequency: "weekly" as const,
      priority: vehicle.status === "sold" ? 0.5 : 0.8,
    })),
  ];
}
