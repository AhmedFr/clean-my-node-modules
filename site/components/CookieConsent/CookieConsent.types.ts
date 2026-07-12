import type { Locale } from "@/lib/i18n";

/** Persisted consent state. `null` means the visitor has not chosen yet. */
export type ConsentChoice = "accepted" | "declined" | null;

/** One locale's banner copy. No em dashes in any language. */
export interface ConsentCopy {
  message: string;
  accept: string;
  decline: string;
}

export type ConsentCopyMap = Record<Locale, ConsentCopy>;
