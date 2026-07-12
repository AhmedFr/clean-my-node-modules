import type { Locale } from "@/lib/i18n";
import type { LegalContent } from "./legal.types";
import { en } from "./en";
import { fr } from "./fr";
import { es } from "./es";
import { de } from "./de";
import { pt } from "./pt";

// Static per-locale map, mirroring lib/i18n/get-dictionary. Server-only, so the
// legal pages render with zero client i18n runtime.
const LEGAL: Record<Locale, LegalContent> = { en, fr, es, de, pt };

export function getLegal(locale: Locale): LegalContent {
  return LEGAL[locale];
}
