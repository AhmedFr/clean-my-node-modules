import { notFound } from "next/navigation";
import { rssResponse } from "@/lib/blog/rss";
import { DEFAULT_LOCALE, EXTRA_LOCALES, isLocale } from "@/lib/i18n";

export const revalidate = 3600;

export function generateStaticParams() {
  return EXTRA_LOCALES.map((locale) => ({ locale }));
}

type Props = { params: Promise<{ locale: string }> };

export async function GET(_req: Request, { params }: Props) {
  const { locale } = await params;
  // Route handlers are NOT wrapped by [locale]/layout.tsx, so the layout's
  // default-locale guard does not protect this endpoint: reject en here so the
  // English feed lives only at /blog/rss.xml, never /en/blog/rss.xml.
  if (!isLocale(locale) || locale === DEFAULT_LOCALE) notFound();
  return rssResponse(locale);
}
