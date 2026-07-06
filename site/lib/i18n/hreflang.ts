import { SITE_URL } from "@/lib/site-url";
import { LOCALES, localePath } from "./locales";

/**
 * Build the `alternates.languages` map for a root-relative English path.
 * Returns an absolute URL per locale plus an `x-default` pointing at the
 * English URL — the shape Next.js metadata and the sitemap expect.
 */
export function languageAlternates(path: string): Record<string, string> {
  const alternates: Record<string, string> = {};
  for (const locale of LOCALES) {
    alternates[locale] = `${SITE_URL}${localePath(locale, path)}`;
  }
  alternates["x-default"] = `${SITE_URL}${path}`;
  return alternates;
}
