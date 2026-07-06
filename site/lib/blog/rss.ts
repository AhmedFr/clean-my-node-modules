import { getPublishedPosts } from "./posts";
import { SITE_URL } from "@/lib/site-url";
import { getDictionary, localePath, type Locale } from "@/lib/i18n";

function esc(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

// RSS 2.0 for a locale's blog. Channel title/description come from the locale
// dictionary; item links are locale-prefixed. Slugs and dates are identical
// across locales, so the feeds differ only in language and URLs.
export function buildRssXml(locale: Locale): string {
  const dict = getDictionary(locale);
  const items = getPublishedPosts(new Date(), locale)
    .map((p) => {
      const url = `${SITE_URL}${localePath(locale, `/blog/${p.slug}`)}`;
      return `    <item>
      <title>${esc(p.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${new Date(`${p.date}T00:00:00Z`).toUTCString()}</pubDate>
      <description>${esc(p.description)}</description>
    </item>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${esc(dict.meta.blogTitle)}</title>
    <link>${SITE_URL}${localePath(locale, "/blog")}</link>
    <description>${esc(dict.meta.blogDescription)}</description>
    <language>${locale}</language>
${items}
  </channel>
</rss>`;
}

export function rssResponse(locale: Locale): Response {
  return new Response(buildRssXml(locale), {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}
