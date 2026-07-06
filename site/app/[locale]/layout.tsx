import { notFound } from "next/navigation";
import { SetHtmlLang } from "@/components/SetHtmlLang";
import { isLocale, DEFAULT_LOCALE } from "@/lib/i18n";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;
  // English is served unprefixed at the root, never at /en.
  if (!isLocale(locale) || locale === DEFAULT_LOCALE) notFound();
  return (
    <>
      <SetHtmlLang locale={locale} />
      {children}
    </>
  );
}
