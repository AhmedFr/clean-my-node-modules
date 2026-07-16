"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { GoogleAnalytics } from "@next/third-parties/google";
import { isLocale, DEFAULT_LOCALE, localePath, type Locale } from "@/lib/i18n";
import {
  CONSENT_COPY,
  CONSENT_EVENT,
  CONSENT_KEY,
  GA_ID,
} from "./CookieConsent.constants";
import type { ConsentChoice } from "./CookieConsent.types";
import { clearGaCookies } from "./clear-ga-cookies";

// The banner lives in the root layout, which has no `locale` param (locale
// pages nest below it). Read it back from the first path segment, mirroring
// `localePath` in lib/i18n: English is unprefixed, others own a `/xx` segment.
function localeFromPathname(pathname: string): Locale {
  const seg = pathname.split("/")[1];
  return seg && isLocale(seg) ? seg : DEFAULT_LOCALE;
}

// GDPR-friendly consent gate: Google Analytics (which sets cookies) is not
// rendered at all until the visitor accepts, so no tracking happens before a
// choice. The choice is remembered in localStorage; declining loads nothing.
export function CookieConsent() {
  const [choice, setChoice] = useState<ConsentChoice>(null);
  const [ready, setReady] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const stored = window.localStorage.getItem(CONSENT_KEY);
    if (stored === "accepted" || stored === "declined") setChoice(stored);
    setReady(true);
  }, []);

  // Withdrawal path (GDPR Art. 7(3)): the footer "Cookie preferences" control
  // dispatches CONSENT_EVENT, which clears the stored choice and reopens the
  // banner so the visitor can change or revoke their consent.
  useEffect(() => {
    function reopen() {
      window.localStorage.removeItem(CONSENT_KEY);
      setChoice(null);
    }
    window.addEventListener(CONSENT_EVENT, reopen);
    return () => window.removeEventListener(CONSENT_EVENT, reopen);
  }, []);

  function decide(next: Exclude<ConsentChoice, null>) {
    window.localStorage.setItem(CONSENT_KEY, next);
    // Withdrawing (or refusing after a prior accept): drop any GA cookies.
    if (next === "declined") clearGaCookies();
    setChoice(next);
  }

  // Avoid a hydration mismatch: render nothing until localStorage is read.
  if (!ready) return null;

  if (choice === "accepted") return <GoogleAnalytics gaId={GA_ID} />;
  if (choice === "declined") return null;

  const locale = localeFromPathname(pathname);
  const copy = CONSENT_COPY[locale];

  return (
    <div className="fixed inset-x-0 bottom-0 z-[200] flex justify-center p-4 max560:p-3">
      <div className="flex w-full max-w-[720px] items-center gap-4 rounded-[14px] border border-line-2 bg-panel/95 px-5 py-4 shadow-[0_14px_44px_-12px_rgba(0,0,0,0.7)] backdrop-blur max560:flex-col max560:items-stretch max560:gap-3">
        <p className="flex-1 text-[13.5px] leading-relaxed text-ink-2">
          {copy.message}{" "}
          <Link
            href={localePath(locale, "/privacy")}
            className="whitespace-nowrap text-accent underline underline-offset-2 hover:text-ink"
          >
            {copy.privacyLink}
          </Link>
        </p>
        <div className="flex shrink-0 items-center gap-[10px] max560:justify-end">
          <button
            type="button"
            onClick={() => decide("declined")}
            className="cursor-pointer rounded-[9px] border border-line-2 bg-white/5 px-[15px] py-2 text-[14px] font-medium text-ink-2 transition-colors hover:text-ink"
          >
            {copy.decline}
          </button>
          <button
            type="button"
            onClick={() => decide("accepted")}
            className="cursor-pointer rounded-[9px] bg-[linear-gradient(180deg,#ff7373,var(--color-accent-deep))] px-[15px] py-2 text-[14px] font-semibold text-white shadow-[0_1px_0_rgba(255,255,255,0.25)_inset,0_8px_22px_-8px_rgba(226,61,61,0.7)] transition-transform hover:-translate-y-[1px]"
          >
            {copy.accept}
          </button>
        </div>
      </div>
    </div>
  );
}
