import type { Metadata } from "next";
import { LegalPage } from "@/components/pages/LegalPage";
import { languageAlternates } from "@/lib/i18n";
import { getLegal } from "@/lib/legal/get-legal";

const legal = getLegal("en");

export const metadata: Metadata = {
  title: `${legal.imprint.title} · TidyDisk`,
  description: legal.imprint.intro,
  alternates: {
    canonical: "/legal",
    languages: languageAlternates("/legal"),
  },
};

export default function Page() {
  return <LegalPage locale="en" />;
}
