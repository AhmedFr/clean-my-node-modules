import type { Locale } from "@/lib/i18n";

// BCP-47 tags for date formatting. English keeps "en-US" so English pages
// render byte-identically to before i18n.
const DATE_LOCALE: Record<Locale, string> = {
  en: "en-US",
  fr: "fr-FR",
  es: "es-ES",
  de: "de-DE",
  pt: "pt-BR",
};

// Publish dates are date-only (midnight UTC); format in UTC so the shown
// day never shifts with the server timezone.
export function formatPostDate(dateStr: string, locale: Locale = "en"): string {
  return new Date(`${dateStr}T00:00:00Z`).toLocaleDateString(
    DATE_LOCALE[locale],
    {
      timeZone: "UTC",
      year: "numeric",
      month: "long",
      day: "numeric",
    },
  );
}
