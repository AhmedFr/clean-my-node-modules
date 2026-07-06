import type { Locale } from "./locales";
import type { Dictionary } from "./i18n.types";
import { en } from "./dictionaries/en";
import { fr } from "./dictionaries/fr";
import { es } from "./dictionaries/es";
import { de } from "./dictionaries/de";
import { pt } from "./dictionaries/pt";

// Static map — every locale's copy is a server-only module, so page components
// can pull their dictionary with zero client-side i18n runtime.
const DICTIONARIES: Record<Locale, Dictionary> = { en, fr, es, de, pt };

export function getDictionary(locale: Locale): Dictionary {
  return DICTIONARIES[locale];
}
