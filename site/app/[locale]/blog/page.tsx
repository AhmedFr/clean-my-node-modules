import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BlogIndex } from "@/components/pages/BlogIndex";
import {
  EXTRA_LOCALES,
  getDictionary,
  isLocale,
  languageAlternates,
  localePath,
} from "@/lib/i18n";

export const revalidate = 3600;

type Props = { params: Promise<{ locale: string }> };

export function generateStaticParams() {
  return EXTRA_LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = getDictionary(locale);
  return {
    title: dict.meta.blogTitle,
    description: dict.meta.blogDescription,
    alternates: {
      canonical: localePath(locale, "/blog"),
      languages: languageAlternates("/blog"),
      types: {
        "application/rss+xml": localePath(locale, "/blog/rss.xml"),
      },
    },
  };
}

export default async function LocaleBlogIndex({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return <BlogIndex locale={locale} />;
}
