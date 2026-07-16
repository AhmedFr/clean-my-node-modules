import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { StatementBand } from "@/components/StatementBand";
import { Areas } from "@/components/Areas";
import { Features } from "@/components/Features";
import { FeatureGrid } from "@/components/FeatureGrid";
import { WhyLifecycle } from "@/components/WhyLifecycle";
import { HowItWorks } from "@/components/HowItWorks";
import { Download } from "@/components/Download";
import { FinalCta } from "@/components/FinalCta";
import { Footer } from "@/components/Footer";
import { JsonLd } from "@/components/JsonLd";
import { SITE_URL } from "@/lib/site-url";
import { getDictionary, localePath, type Locale } from "@/lib/i18n";

// The whole marketing page, parameterized by locale. Rendered by the English
// route (`app/page.tsx`, locale="en") and the locale routes
// (`app/[locale]/page.tsx`).
export function HomePage({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: "TidyDisk",
          operatingSystem: "macOS 13.0 or later",
          applicationCategory: "UtilitiesApplication",
          inLanguage: locale,
          description: dict.meta.description,
          url: `${SITE_URL}${localePath(locale, "/")}`,
          offers: [
            {
              "@type": "Offer",
              price: "0",
              priceCurrency: "EUR",
              description: "Free scan",
            },
            {
              "@type": "Offer",
              price: "19",
              priceCurrency: "EUR",
              description: "Lifetime license for one-click cleanup",
            },
          ],
        }}
      />
      <Navbar dict={dict} locale={locale} />
      <main id="top">
        <Hero dict={dict} />
        <StatementBand dict={dict} />
        <Areas dict={dict} />
        <Features dict={dict} />
        <FeatureGrid dict={dict} />
        <WhyLifecycle dict={dict} />
        <HowItWorks dict={dict} />
        <Download dict={dict} />
        <FinalCta dict={dict} />
      </main>
      <Footer dict={dict} locale={locale} path="/" />
    </>
  );
}
