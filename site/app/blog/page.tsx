import type { Metadata } from "next";
import { BlogIndex } from "@/components/pages/BlogIndex";
import { getDictionary, languageAlternates } from "@/lib/i18n";

// Posts are date-gated; hourly revalidation lets scheduled posts appear on
// their own, with no deploy.
export const revalidate = 3600;

const meta = getDictionary("en").meta;

export const metadata: Metadata = {
  title: meta.blogTitle,
  description: meta.blogDescription,
  alternates: {
    canonical: "/blog",
    languages: languageAlternates("/blog"),
    types: { "application/rss+xml": "/blog/rss.xml" },
  },
};

export default function BlogIndexPage() {
  return <BlogIndex locale="en" />;
}
