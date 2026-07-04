# TidyDisk SEO fixes + auto-publishing blog

Date: 2026-07-04
Status: approved by user ("LGTM go go go")
Branch: feat/blog-seo

## Goal

Fix the SEO gaps on tidydisk.app and add a blog that ships with 10 pre-written,
keyword-targeted articles which publish themselves one per week with no deploys
or external services.

## Audit findings (2026-07-04)

- No robots.txt (404 on live site).
- No sitemap.xml (404 on live site).
- No canonical tags on any page.
- Canonical mismatch: code declares `https://tidydisk.app` as metadataBase, but
  Vercel 308-redirects apex to `www.tidydisk.app`. Decision: apex is canonical;
  the user flips the primary domain in the Vercel dashboard (user action).
- No structured data (JSON-LD).
- `/og` capture-helper page is indexable but should not be.
- On-page basics (title, description, OG/Twitter cards, single h1) are good.

## Part 1: SEO fixes (all in `site/`)

1. `app/robots.ts`: allow all, disallow `/og`, reference the sitemap.
2. `app/sitemap.ts`: homepage + published blog posts only (date-gated), hourly
   ISR revalidation, lastModified = post date.
3. Canonical: `alternates.canonical` on the root layout ("/"), blog listing
   ("/blog"), and each article ("/blog/[slug]"), resolved against the existing
   metadataBase (`https://tidydisk.app`).
4. JSON-LD: `SoftwareApplication` on the homepage (macOS, free scan, 19 EUR
   one-time offer via Polar); `BlogPosting` on each article page.
5. `/og` page: `robots: { index: false }` metadata + robots.txt disallow.
6. User action (Vercel dashboard): set `tidydisk.app` as the primary domain so
   www redirects to apex, matching the canonical. Tracked in STATUS.html
   userActions.

## Part 2: Blog

### Architecture (approach A, chosen over scheduled redeploys and a CMS)

- Content: plain markdown files in `site/content/blog/*.md` with frontmatter:
  `title`, `description`, `date` (YYYY-MM-DD), `slug` (derived from filename),
  optional `keywords`.
- Pipeline: `gray-matter` for frontmatter, `remark`/`remark-html` (unified) for
  markdown -> HTML. One module `lib/blog/` (single responsibility per file):
  - `blog.types.ts`: `BlogPostMeta`, `BlogPost`.
  - `posts.ts`: read directory, parse frontmatter, sort by date desc.
  - `gating.ts`: `isPublished(post, now)`: a post is published when its date
    (interpreted as midnight UTC) is <= now. Unit-tested.
  - `index.ts`: barrel.
- Routes (App Router, ISR):
  - `/blog`: listing of published posts. `export const revalidate = 3600`.
  - `/blog/[slug]`: article page; future-dated slugs return `notFound()`.
    `generateStaticParams` only emits published slugs; `dynamicParams = true`
    so a post that crosses its publish date is rendered on demand.
  - `/blog/rss.xml`: route handler, published posts only, `revalidate = 3600`.
  - `app/sitemap.ts` shares the same gating.
- Auto-publish mechanism: ISR. Every page that lists or renders posts
  revalidates hourly and filters on the current time, so a scheduled post
  appears within an hour of its date with zero deploys.
- UI: reuse Navbar, Footer, landing.css design tokens. Navbar gains a "Blog"
  link. Article pages get a readable prose style consistent with the landing
  aesthetic.
- Byline: "TidyDisk team". Dates shown. Each article ends with a download CTA.
- Copy rule: no em dashes anywhere in article or UI copy.

### Articles and schedule (weekly from 2026-07-04)

| # | Date       | Working title (target keyword)                                        |
|---|------------|-----------------------------------------------------------------------|
| 1 | 2026-07-04 | How to delete node_modules safely and get gigabytes back              |
| 2 | 2026-07-11 | Why is node_modules so huge? What is actually inside                  |
| 3 | 2026-07-18 | The pnpm store explained: where your disk space really goes           |
| 4 | 2026-07-25 | How to find every node_modules folder on your Mac                     |
| 5 | 2026-08-01 | npm cache clean: what it actually frees (and what it does not)        |
| 6 | 2026-08-08 | Free up disk space on a Mac: the developer's checklist                |
| 7 | 2026-08-15 | npkill vs manual cleanup vs TidyDisk: which should you use?           |
| 8 | 2026-08-22 | npm vs yarn vs pnpm: which wastes the least disk space?               |
| 9 | 2026-08-29 | Why you should never rm -rf node_modules (use the Trash)              |
| 10| 2026-09-05 | Monorepos and disk space: taming node_modules at scale                |

~900-1200 words each, accurate technical content, natural keyword usage,
internal links between related posts, one CTA per article.

## Testing

- Unit tests (vitest): date gating (past/today/future, UTC edge), post loading
  and sorting, RSS/sitemap only include published posts.
- `pnpm typecheck`, `pnpm test`, `pnpm build` green; CI green on the PR.

## Error handling

- Malformed frontmatter (missing title/date, invalid date): build-time throw
  with the offending filename, so a bad article can never ship silently.
- Unknown slug or future-dated slug: 404.

## Out of scope

- CMS, comments, tags/categories, pagination (10 posts fit one page),
  newsletter, i18n.
