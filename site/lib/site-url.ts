// Absolute base for canonical/OG/sitemap/RSS URLs. Auto-resolves on Vercel;
// override with NEXT_PUBLIC_SITE_URL once a custom domain changes.
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "https://tidydisk.app");
