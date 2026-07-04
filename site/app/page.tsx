import type { Metadata } from "next";
import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { StatementBand } from "@/components/StatementBand";
import { Features } from "@/components/Features";
import { FeatureGrid } from "@/components/FeatureGrid";
import { WhyLifecycle } from "@/components/WhyLifecycle";
import { HowItWorks } from "@/components/HowItWorks";
import { Download } from "@/components/Download";
import { FinalCta } from "@/components/FinalCta";
import { Footer } from "@/components/Footer";
import { JsonLd } from "@/components/JsonLd";
import { SITE_URL } from "@/lib/site-url";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default function Home() {
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: "TidyDisk",
          operatingSystem: "macOS 13.0 or later",
          applicationCategory: "UtilitiesApplication",
          description:
            "macOS menu bar app that finds every node_modules folder, your pnpm store, and installed packages, and reclaims the disk space safely.",
          url: SITE_URL,
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
      <Navbar />
      <main id="top">
        <Hero />
        <StatementBand />
        <Features />
        <FeatureGrid />
        <WhyLifecycle />
        <HowItWorks />
        <Download />
        <FinalCta />
      </main>
      <Footer />
    </>
  );
}
