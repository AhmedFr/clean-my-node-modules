import Link from "next/link";
import { cn } from "@/lib/utils";
import { LOCALES, LOCALE_NAMES, localePath, type Locale } from "@/lib/i18n";

export interface LangSwitcherProps {
  /** The active locale (rendered non-linked). */
  locale: Locale;
  /** The current logical path without locale prefix, e.g. "/", "/blog", "/blog/<slug>". */
  path: string;
}

// Server-rendered locale picker: links to the equivalent page in each locale.
export function LangSwitcher({ locale, path }: LangSwitcherProps) {
  return (
    <nav aria-label="Language" className="flex flex-wrap items-center gap-x-[10px] gap-y-1 font-mono text-[13px]">
      {LOCALES.map((l) =>
        l === locale ? (
          <span key={l} aria-current="true" className="text-ink-2">
            {LOCALE_NAMES[l]}
          </span>
        ) : (
          <Link
            key={l}
            href={localePath(l, path)}
            hrefLang={l}
            className={cn(
              "text-ink-4 transition-colors duration-150 hover:text-ink-2",
            )}
          >
            {LOCALE_NAMES[l]}
          </Link>
        ),
      )}
    </nav>
  );
}
