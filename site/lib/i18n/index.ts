// Public API for the i18n layer.
export {
  LOCALES,
  DEFAULT_LOCALE,
  EXTRA_LOCALES,
  LOCALE_NAMES,
  OG_LOCALES,
  isLocale,
  localePath,
} from "./locales";
export type { Locale } from "./locales";
export { languageAlternates } from "./hreflang";
export { getDictionary } from "./get-dictionary";
export type {
  Dictionary,
  MetaCopy,
  NavCopy,
  HeroCopy,
  BandCopy,
  FeatureCopy,
  GridCardCopy,
  GridCopy,
  WhyCopy,
  HowStepCopy,
  HowCopy,
  DownloadFreeCopy,
  DownloadProCopy,
  DownloadCopy,
  FinalCtaCopy,
  FooterLinksCopy,
  FooterCopy,
  BlogChromeCopy,
} from "./i18n.types";
