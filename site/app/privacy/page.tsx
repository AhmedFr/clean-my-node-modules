import type { Metadata } from "next";
import { PrivacyPage } from "@/components/pages/PrivacyPage";
import { languageAlternates } from "@/lib/i18n";
import { getLegal } from "@/lib/legal/get-legal";

const legal = getLegal("en");

export const metadata: Metadata = {
  title: `${legal.privacy.title} · TidyDisk`,
  description: legal.privacy.intro,
  alternates: {
    canonical: "/privacy",
    languages: languageAlternates("/privacy"),
  },
};

export default function Page() {
  return <PrivacyPage locale="en" />;
}
