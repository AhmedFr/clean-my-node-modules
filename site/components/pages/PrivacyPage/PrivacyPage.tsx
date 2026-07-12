import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { LegalArticle } from "@/components/LegalArticle";
import { formatPostDate } from "@/app/blog/format-date";
import { getDictionary, type Locale } from "@/lib/i18n";
import { getLegal } from "@/lib/legal/get-legal";
import { LEGAL_UPDATED } from "@/lib/legal/legal.constants";

// The privacy policy page, parameterized by locale. Rendered by the English
// route (app/privacy, locale="en") and the locale routes (app/[locale]/privacy).
export function PrivacyPage({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);
  const legal = getLegal(locale);
  return (
    <>
      <Navbar dict={dict} locale={locale} />
      <LegalArticle
        doc={legal.privacy}
        updatedLabel={legal.updatedLabel}
        updated={formatPostDate(LEGAL_UPDATED, locale)}
      />
      <Footer dict={dict} locale={locale} path="/privacy" />
    </>
  );
}
