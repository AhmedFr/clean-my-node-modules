import type { MetadataRoute } from "next";
import { getPublishedPosts } from "@/lib/blog";
import { SITE_URL } from "@/lib/site-url";
import { LOCALES, localePath, languageAlternates } from "@/lib/i18n";

// Revalidates hourly so newly-published posts join without a deploy.
export const revalidate = 3600;

export default function sitemap(): MetadataRoute.Sitemap {
  // Slugs and dates are identical across locales, so the English list drives
  // every locale's URLs.
  const posts = getPublishedPosts();
  const newest = posts[0]?.date;

  const paths = [
    { path: "/", lastModified: new Date(), changeFrequency: "weekly" as const, priority: 1 },
    {
      path: "/blog",
      lastModified: newest ? new Date(`${newest}T00:00:00Z`) : new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    },
    ...posts.map((p) => ({
      path: `/blog/${p.slug}`,
      lastModified: new Date(`${p.date}T00:00:00Z`),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];

  // One entry per (path, locale), each carrying the full hreflang alternates
  // map (incl. x-default) — Google's preferred sitemap encoding.
  return paths.flatMap(({ path, lastModified, changeFrequency, priority }) => {
    const languages = languageAlternates(path);
    return LOCALES.map((locale) => ({
      url: `${SITE_URL}${localePath(locale, path)}`,
      lastModified,
      changeFrequency,
      priority,
      alternates: { languages },
    }));
  });
}
