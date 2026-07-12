import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LegalPage } from "@/components/pages/LegalPage";
import {
  EXTRA_LOCALES,
  isLocale,
  languageAlternates,
  localePath,
} from "@/lib/i18n";
import { getLegal } from "@/lib/legal/get-legal";

type Props = { params: Promise<{ locale: string }> };

export function generateStaticParams() {
  return EXTRA_LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const legal = getLegal(locale);
  return {
    title: `${legal.imprint.title} · TidyDisk`,
    description: legal.imprint.intro,
    alternates: {
      canonical: localePath(locale, "/legal"),
      languages: languageAlternates("/legal"),
    },
  };
}

export default async function Page({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return <LegalPage locale={locale} />;
}
