// Factual identity for the legal pages. Same in every locale, so it is never
// translated: the page components render it from here directly. Update these
// values, not the per-locale content files, if the business details change.
export const OWNER = {
  name: "Ahmed ABOUELLEIL SAYED",
  addressLines: ["26 rue Jean Voillot", "69500 Bron", "France"],
  email: "contact@tidydisk.app",
  siret: "90884903700027",
  country: "France",
  // Auto-entreprise under the French VAT-exemption regime. This is a legally
  // fixed French citation, so it stays in French in every locale (like SIRET).
  vatNote: "TVA non applicable, art. 293 B du CGI",
} as const;

/** ISO date the legal pages were last reviewed; shown as "Last updated". */
export const LEGAL_UPDATED = "2026-07-12";
