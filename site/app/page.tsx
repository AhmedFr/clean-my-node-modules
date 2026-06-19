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

export default function Home() {
  return (
    <>
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
