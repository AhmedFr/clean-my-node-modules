import type { ReactNode } from "react";

// The Dictionary is the single contract for EVERY user-facing string on the
// marketing site + blog chrome + per-locale page metadata.
//
// Locale-content authors: implement this interface VERBATIM per locale
// (`dictionaries/<locale>.tsx`, `export const <locale>: Dictionary = { … }`).
// Only the human-readable text is translated. Fields typed `ReactNode` MUST
// reproduce the SAME element structure as English — identical tags and
// `className`s (`<code>`, `<b>`, `<em>`, `<br/>`, the accent
// `<span className="text-accent">…</span>`) — with only the wrapped text
// translated. Do NOT translate technical tokens that stay in code style:
// `node_modules`, `rm -rf`, `npm install`, `pnpm`, package/command names,
// paths like `~/.pnpm-store`, and the `.next` / `dist` examples. Prices read
// "19 euros" / "€19" as in English. No em dashes in any language.

/** Page-level SEO metadata (all plain strings). */
export interface MetaCopy {
  title: string;
  description: string;
  blogTitle: string;
  blogDescription: string;
  ogAlt: string;
}

/** Navbar links + button labels. */
export interface NavCopy {
  features: string;
  packages: string;
  why: string;
  how: string;
  download: string;
  blog: string;
  github: string;
  getApp: string;
}

export interface HeroCopy {
  eyebrow: string;
  /** Has an accent `<span className="text-accent">` around "tidy disk". */
  heading: ReactNode;
  /** Ends with `<code>rm -rf</code>`. */
  body: ReactNode;
  downloadCta: string;
  githubCta: string;
  micro: string;
}

export interface BandCopy {
  /** `<code>node_modules</code>` … accent `<em>`. */
  statement: ReactNode;
}

/** One of the four alternating feature rows. */
export interface FeatureCopy {
  tagline: string;
  heading: string;
  /** May contain inline `<code>`. */
  body: ReactNode;
  /** Each bullet may contain inline markup (`<code>`, `<b>`). */
  bullets: ReactNode[];
}

/** One card in the nine-up feature grid (icon stays in the component). */
export interface GridCardCopy {
  title: string;
  copy: string;
}

export interface GridCopy {
  kicker: string;
  /** Accent `<span>` around "Big relief.". */
  heading: ReactNode;
  lead: string;
  cards: [
    GridCardCopy,
    GridCardCopy,
    GridCardCopy,
    GridCardCopy,
    GridCardCopy,
    GridCardCopy,
    GridCardCopy,
    GridCardCopy,
    GridCardCopy,
  ];
  comingSoonPill: string;
  /** Has `<code>.next</code>` and `<code>dist</code>`. */
  comingSoonText: ReactNode;
}

export interface WhyCopy {
  kicker: string;
  /** Accent `<span>` around "node_modules". */
  heading: ReactNode;
  lead: string;
  npmTag: string;
  pnpmTag: string;
  /** Has `<b>` emphasis and a `<code>lodash</code>`. */
  npmNote: ReactNode;
  /** Has `<b>` emphasis. */
  pnpmNote: ReactNode;
  /** The "· stored once" suffix; the `~/.pnpm-store` path stays in the component. */
  storeLabel: string;
  /** Green callout: `<b>`, `<code>node_modules</code>`, `<code>npm install</code>`. */
  footNote: ReactNode;
  /** Has `<b>` emphasis. */
  sizingNote: ReactNode;
}

/** One of the three "how it works" steps. */
export interface HowStepCopy {
  num: string;
  title: string;
  body: string;
  /** Terminal snippet; keeps the `<span className="pmt">` prompt markup. */
  cmd: ReactNode;
}

export interface HowCopy {
  kicker: string;
  /** Accent `<span>` around "lighter Mac.". */
  heading: ReactNode;
  steps: [HowStepCopy, HowStepCopy, HowStepCopy];
}

/** Free ("$0") download tier. */
export interface DownloadFreeCopy {
  /** Accent `<span>` around "$0". */
  name: ReactNode;
  desc: string;
  bullets: ReactNode[];
  cta: string;
}

/** Paid ("€19") download tier. */
export interface DownloadProCopy {
  badge: string;
  /** Accent `<span>` around "€19". */
  name: ReactNode;
  desc: string;
  bullets: ReactNode[];
  cta: string;
}

export interface DownloadCopy {
  kicker: string;
  /** Accent `<span>` around "19 euros to clean.". */
  heading: ReactNode;
  lead: string;
  free: DownloadFreeCopy;
  pro: DownloadProCopy;
}

export interface FinalCtaCopy {
  /** Has a `<br/>` between the two lines. */
  heading: ReactNode;
  body: string;
  downloadCta: string;
  buyCta: string;
}

export interface FooterLinksCopy {
  feature: string;
  how: string;
  download: string;
  blog: string;
  repo: string;
  issues: string;
  releases: string;
  privacy: string;
  legal: string;
  /** Reopens the cookie consent banner (consent withdrawal). */
  cookies: string;
}

export interface FooterCopy {
  tagline: string;
  productHead: string;
  openSourceHead: string;
  /** Heading for the legal column (privacy, legal notice, cookies). */
  legalHead: string;
  links: FooterLinksCopy;
  copyright: string;
  platform: string;
}

/** Blog chrome: index header + article header + article CTA. */
export interface BlogChromeCopy {
  eyebrow: string;
  /** Accent `<span>` around "clean". */
  listTitle: ReactNode;
  listLead: string;
  readArticle: string;
  backToArticles: string;
  byline: string;
  ctaTitle: string;
  ctaBody: string;
  ctaButton: string;
}

export interface Dictionary {
  meta: MetaCopy;
  nav: NavCopy;
  hero: HeroCopy;
  band: BandCopy;
  /** Exactly five feature rows, in display order (row 5 is Docker). */
  features: [FeatureCopy, FeatureCopy, FeatureCopy, FeatureCopy, FeatureCopy];
  grid: GridCopy;
  why: WhyCopy;
  how: HowCopy;
  download: DownloadCopy;
  finalCta: FinalCtaCopy;
  footer: FooterCopy;
  blog: BlogChromeCopy;
}
