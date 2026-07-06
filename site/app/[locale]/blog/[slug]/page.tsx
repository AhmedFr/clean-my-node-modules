import type { Metadata } from "next";
import { BlogArticle } from "@/components/pages/BlogArticle";
import { getPostHtml, getPublishedPosts } from "@/lib/blog";
import {
  EXTRA_LOCALES,
  isLocale,
  languageAlternates,
  localePath,
  type Locale,
} from "@/lib/i18n";

export const revalidate = 3600;
export const dynamicParams = true;

type Props = { params: Promise<{ locale: string; slug: string }> };

export function generateStaticParams() {
  return EXTRA_LOCALES.flatMap((locale) =>
    getPublishedPosts(new Date(), locale).map((p) => ({
      locale,
      slug: p.slug,
    })),
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  const post = await getPostHtml(slug, new Date(), locale);
  if (!post) return {};
  const path = `/blog/${post.meta.slug}`;
  return {
    title: `${post.meta.title} | TidyDisk blog`,
    description: post.meta.description,
    alternates: {
      canonical: localePath(locale, path),
      languages: languageAlternates(path),
    },
    openGraph: {
      type: "article",
      locale,
      url: localePath(locale, path),
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

export default async function LocaleBlogPost({ params }: Props) {
  const { locale, slug } = await params;
  return <BlogArticle locale={locale as Locale} slug={slug} />;
}
