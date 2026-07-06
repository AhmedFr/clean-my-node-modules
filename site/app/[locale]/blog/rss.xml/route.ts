import { notFound } from "next/navigation";
import { rssResponse } from "@/lib/blog/rss";
import { EXTRA_LOCALES, isLocale } from "@/lib/i18n";

export const revalidate = 3600;

export function generateStaticParams() {
  return EXTRA_LOCALES.map((locale) => ({ locale }));
}

type Props = { params: Promise<{ locale: string }> };

export async function GET(_req: Request, { params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return rssResponse(locale);
}
