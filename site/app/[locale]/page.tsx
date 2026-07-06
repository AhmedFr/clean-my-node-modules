import type { Metadata } from "next";
import { HomePage } from "@/components/pages/HomePage";
import {
  EXTRA_LOCALES,
  getDictionary,
  isLocale,
  languageAlternates,
  localePath,
  type Locale,
} from "@/lib/i18n";

type Props = { params: Promise<{ locale: string }> };

export function generateStaticParams() {
  return EXTRA_LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = getDictionary(locale);
  return {
    title: dict.meta.title,
    description: dict.meta.description,
    alternates: {
      canonical: localePath(locale, "/"),
      languages: languageAlternates("/"),
    },
    openGraph: { locale },
  };
}

export default async function LocaleHome({ params }: Props) {
  const { locale } = await params;
  return <HomePage locale={locale as Locale} />;
}
