import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site-url";

// /og is the fixed-size social-card capture helper, not a marketing page.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: "/og" },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
