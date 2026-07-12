// Content model for the standalone legal pages (privacy policy + imprint).
// Kept OUT of the main marketing Dictionary so the long-form legal prose does
// not bloat that contract; still typed and authored once per locale, mirroring
// the dictionaries. Factual identity (name, address, SIRET, email) is NOT part
// of this model. It lives in legal.constants.ts and is injected by the page
// components, so translators never touch it.

/** A titled block of prose, optionally followed by a bullet list. */
export interface LegalSection {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
}

export interface LegalDoc {
  title: string;
  /** Lead paragraph shown under the title. */
  intro: string;
  sections: LegalSection[];
}

/** Translated labels for the factual identity block on the imprint page. */
export interface ImprintLabels {
  responsible: string;
  address: string;
  email: string;
  siret: string;
  vat: string;
}

export interface LegalContent {
  /** e.g. "Last updated" */
  updatedLabel: string;
  privacy: LegalDoc;
  imprint: LegalDoc & { labels: ImprintLabels };
}
