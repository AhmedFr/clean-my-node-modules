import type { ReactNode } from "react";
import type { LegalDoc } from "@/lib/legal/legal.types";

export interface LegalArticleProps {
  doc: LegalDoc;
  /** Localized "Last updated" label. */
  updatedLabel: string;
  /** Already-formatted, localized date string. */
  updated: string;
  /** Optional block rendered between the intro and the sections (the imprint
   *  identity card). */
  children?: ReactNode;
}
