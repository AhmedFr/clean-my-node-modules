import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PrivacyPage } from "@/components/pages/PrivacyPage";
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
    title: `${legal.privacy.title} · TidyDisk`,
    description: legal.privacy.intro,
    alternates: {
      canonical: localePath(locale, "/privacy"),
      languages: languageAlternates("/privacy"),
    },
  };
}

export default async function Page({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return <PrivacyPage locale={locale} />;
}
