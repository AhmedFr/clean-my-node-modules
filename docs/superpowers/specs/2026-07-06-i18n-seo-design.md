# Site i18n (en/fr/es/de/pt) + "godlike" SEO and page-score hardening

Date: 2026-07-06
Status: awaiting user review
Branch (implementation): feat/site-i18n-seo
Sequenced AFTER the Tailwind migration (2026-07-06-tailwind-migration-cleanup-design.md).

## Goal

Take tidydisk.app from a well-optimized English site to a five-locale site
with complete hreflang/canonical wiring, fully translated landing + blog
content, and top Lighthouse scores.

## Decisions made with the user (2026-07-06)

- Locales: en (default) + fr, es, de, pt.
- Everything translated, including all 10 blog articles per locale, keeping
  each article's weekly release date (gating logic unchanged).
- URLs: English stays at the root (`/`, `/blog/...`) preserving all indexed
  URLs; locales get subpaths (`/fr`, `/fr/blog/...`). No Accept-Language
  auto-redirect (Google treats it as cloaking risk); a language switcher
  instead.

## Design

### Routing (explicit twin trees, no middleware)

- `app/page.tsx`, `app/blog/*` keep serving English by delegating to shared
  page components with `locale="en"`.
- New `app/[locale]/page.tsx` and `app/[locale]/blog/*` render the same
  shared components with the param locale. `generateStaticParams` emits
  fr/es/de/pt; unknown locales 404. ISR/date-gating behavior identical to
  the English tree.
- `<html lang>` follows the locale (root layout gets it from the segment).

### Copy management

- `site/lib/i18n/`: a typed `Dictionary` interface (sections: nav, hero,
  band, features, grid, lifecycle, how, download, finalCta, footer, blog
  chrome) + one module per locale (`en.ts`, `fr.ts`, `es.ts`, `de.ts`,
  `pt.ts`). TypeScript enforces every locale covers every key.
- Components receive their dictionary slice via props from the page level
  (server components; no client i18n runtime, zero JS cost).
- Brand voice rules apply in every language: no em dashes, `node_modules`
  and `rm -rf` stay in code style, prices stay "19 euro".

### Blog content

- `site/content/blog/` gains locale subdirectories: existing articles move
  to `content/blog/en/`, translations live in `content/blog/fr/` etc.
- Slugs stay IDENTICAL across locales (keeps the hreflang map trivial and
  the migration free of redirects); titles/descriptions/body are translated.
- `lib/blog` gets a `locale` parameter (default "en"); frontmatter
  validation, date gating, and sorting unchanged. A test asserts every
  locale directory contains exactly the same slug set with the same dates,
  so a missing translation fails the build.
- RSS per locale at `/{locale}/blog/rss.xml` (English stays `/blog/rss.xml`).

### hreflang / canonical / sitemap

- Every page: self-referencing canonical + `alternates.languages` listing
  all five locale URLs plus `x-default` -> the English URL.
- `app/sitemap.ts`: one entry per URL per locale with `alternates.languages`
  (Google's preferred sitemap hreflang encoding), still hourly-revalidated
  and date-gated.
- Localized `title`/`description`/OG metadata per locale from the
  dictionaries. JSON-LD (`SoftwareApplication`, `BlogPosting`) gets
  `inLanguage` and localized descriptions.
- Localized OG cards: the /og capture helper takes a `?locale=` param; the
  make-og script loops the five locales producing `og.png`, `og-fr.png`,
  etc. (low-priority final task).

### Language switcher

Small footer/nav control listing the five locales, linking to the
equivalent page in each locale (not just the homepage). Rendered
server-side, plain links, no cookies.

### Lighthouse "perfect score" work

Target: 100 / 100 / 100 / 100 (Performance, Accessibility, Best Practices,
SEO) on desktop for `/`, `/blog`, one article; mobile Performance 95+ (Vercel
production measurement is the source of truth; local Lighthouse in CI-like
conditions is the development proxy).

- Fonts (the big one): all three families currently load render-blocking
  from Google Fonts + Fontshare CDNs. JetBrains Mono moves to
  `next/font/google`; Cabinet Grotesk + General Sans get self-hosted woff2
  via `next/font/local` (Fontshare's ITF Free Font License permits web
  embedding; files ship in `site/app/fonts/`). All preconnect links die.
- Accessibility: alt/aria audit of every image and inline SVG (decorative ->
  `aria-hidden`, meaningful -> labels); heading-order check; contrast check
  on `ink-3`/`ink-4` text. Where Lighthouse contrast failures conflict with
  the existing palette, minimal nudges are allowed here (explicitly relaxing
  Project 1's pixel-faithful rule, AFTER it merged).
- Best practices / SEO: already strong (canonicals, robots, sitemap, JSON-LD
  from the July 4 work); this project adds hreflang completeness and
  descriptive link texts in all locales.

## Testing

- Dictionary type-completeness enforced by tsc.
- Blog locale-parity test (same slugs + dates in every locale dir).
- Existing gating/pixrow/meter tests keep passing; new tests for
  locale-aware post loading and hreflang URL building.
- Playwright pass per locale (5 homepages + 5 blog indexes render, switcher
  round-trips), Lighthouse runs on the three key pages.

## Content volume note

4 locales x (landing dictionary + 10 articles of 900-1200 words) is the bulk
of the work (~40k words). The plan batches article translation per locale so
sessions stay reviewable; the routing/dictionary infrastructure lands first
with fr, then es/de/pt content follows in the same PR or stacked PRs.

## Out of scope

- Auto language detection/redirects, cookies, geo-IP.
- Translating the Electron app UI.
- Paid-search/keyword tooling; this is on-page SEO only.
