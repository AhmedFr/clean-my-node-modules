import type { MetadataRoute } from "next";
import { getPublishedPosts } from "@/lib/blog";
import { SITE_URL } from "@/lib/site-url";

// Revalidates hourly so newly-published posts join without a deploy.
export const revalidate = 3600;

export default function sitemap(): MetadataRoute.Sitemap {
  const posts = getPublishedPosts();
  const newest = posts[0]?.date;
  return [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${SITE_URL}/blog`,
      lastModified: newest ? new Date(`${newest}T00:00:00Z`) : new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    ...posts.map((p) => ({
      url: `${SITE_URL}/blog/${p.slug}`,
      lastModified: new Date(`${p.date}T00:00:00Z`),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
