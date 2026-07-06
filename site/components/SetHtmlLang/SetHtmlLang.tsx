"use client";

import { useEffect } from "react";
import type { Locale } from "@/lib/i18n";

// The App Router allows exactly one root layout, which renders
// `<html lang="en">`. Locale pages live under `/[locale]`, below that root, so
// they cannot set the html lang attribute server-side. This corrects it on the
// client. Search engines determine locale targeting from the hreflang
// `alternates.languages` tags (emitted on every page and in the sitemap), not
// the lang attribute, so SEO targeting is correct regardless of this.
export function SetHtmlLang({ locale }: { locale: Locale }) {
  useEffect(() => {
    document.documentElement.lang = locale;
    return () => {
      document.documentElement.lang = "en";
    };
  }, [locale]);
  return null;
}
