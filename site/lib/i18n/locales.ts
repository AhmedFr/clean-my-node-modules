// Locale primitives shared by the dictionary layer, blog loader, and (in a
// later task) the route trees. English is the default and stays unprefixed at
// the root (`/`, `/blog/...`); every other locale is served under its own path
// segment (`/fr`, `/fr/blog/...`). `localePath` and `hreflang` encode exactly
// that convention, so keep them the single source of truth for URL shape.

export const LOCALES = ["en", "fr", "es", "de", "pt"] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";

/** Every locale except the default — the ones that get a URL prefix. */
export const EXTRA_LOCALES: Locale[] = LOCALES.filter((l) => l !== "en");

export function isLocale(x: string): x is Locale {
  return (LOCALES as readonly string[]).includes(x);
}

/**
 * Turn a root-relative English path into its locale-specific form.
 * English is returned unchanged; other locales get their segment prefixed
 * ahead of the path.
 */
export function localePath(locale: Locale, path: string): string {
  if (locale === "en") return path;
  if (path === "/") return `/${locale}`;
  // Home-anchor paths ("/#features") attach the hash directly to the locale
  // root ("/fr#features"); "/fr/#features" would have a stray slash that
  // 308-redirects and reads as a non-canonical URL.
  if (path.startsWith("/#")) return `/${locale}${path.slice(1)}`;
  return `/${locale}${path}`;
}

export const LOCALE_NAMES: Record<Locale, string> = {
  en: "English",
  fr: "Français",
  es: "Español",
  de: "Deutsch",
  pt: "Português",
};

/** OpenGraph `og:locale` values (language_TERRITORY), not the bare codes. */
export const OG_LOCALES: Record<Locale, string> = {
  en: "en_US",
  fr: "fr_FR",
  es: "es_ES",
  de: "de_DE",
  pt: "pt_BR",
};
