import type { Metadata } from "next";
import { getPostHtml, getPublishedPosts } from "@/lib/blog";
import { languageAlternates } from "@/lib/i18n";
import { BlogArticle } from "@/components/pages/BlogArticle";

export const revalidate = 3600;
// Future-dated posts are not pre-rendered; once their date passes they are
// rendered on demand instead of 404ing.
export const dynamicParams = true;

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return getPublishedPosts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await getPostHtml((await params).slug);
  if (!post) return {};
  const path = `/blog/${post.meta.slug}`;
  return {
    title: `${post.meta.title} | TidyDisk blog`,
    description: post.meta.description,
    alternates: { canonical: path, languages: languageAlternates(path) },
    openGraph: {
      type: "article",
      url: path,
      siteName: "TidyDisk",
      title: post.meta.title,
      description: post.meta.description,
      publishedTime: `${post.meta.date}T00:00:00Z`,
    },
    twitter: {
      card: "summary_large_image",
      title: post.meta.title,
      description: post.meta.description,
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  return <BlogArticle locale="en" slug={(await params).slug} />;
}
