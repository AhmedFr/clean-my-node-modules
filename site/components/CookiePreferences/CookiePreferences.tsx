"use client";

import { CONSENT_EVENT } from "@/components/CookieConsent/CookieConsent.constants";
import type { CookiePreferencesProps } from "./CookiePreferences.types";

// Footer control that reopens the cookie consent banner. Rendered as a button
// (not a link) because it triggers UI rather than navigating; the actual
// consent state lives in the CookieConsent component, which listens for
// CONSENT_EVENT. This is the visitor's always-available withdrawal path.
export function CookiePreferences({ label, className }: CookiePreferencesProps) {
  return (
    <button
      type="button"
      className={className}
      onClick={() => window.dispatchEvent(new Event(CONSENT_EVENT))}
    >
      {label}
    </button>
  );
}
