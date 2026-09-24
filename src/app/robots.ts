import type { MetadataRoute } from "next";

import { siteUrl } from "@/config/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      /* A second layer behind the `noindex` on every admin page. The usual
         objection to disallowing a page you want de-indexed — that a crawler
         which cannot fetch it cannot read the `noindex` — does not apply here:
         everything under /admin redirects to a sign-in form, so there is nothing
         for a crawler to index in the first place. This keeps the crawler out of
         a section it has no business walking. */
      disallow: "/admin",
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
