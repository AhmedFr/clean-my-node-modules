// data.jsx — mock node_modules inventory + formatting helpers.

const MB = 1024 * 1024;
const now = Date.now();
const DAY = 86400000;

// size in bytes, lastUsed = days ago
function proj(id, name, path, kind, sizeMB, daysAgo) {
  return { id, name, path, kind, size: Math.round(sizeMB * MB), lastUsed: now - daysAgo * DAY };
}

const MOCK_PROJECTS = [
  proj("p1",  "legacy-dashboard",     "~/Code/clients/acme/legacy-dashboard",   "react",  612, 408),
  proj("p2",  "portfolio-2021",       "~/Sites/portfolio-2021",                 "vue",    284, 365),
  proj("p3",  "hackathon-bot",        "~/Code/experiments/hackathon-bot",       "node",   441, 286),
  proj("p4",  "recipe-app-old",       "~/Code/personal/recipe-app-old",         "expo",   903, 221),
  proj("p5",  "marketing-site",       "~/Work/marketing-site",                  "next",   538, 132),
  proj("p6",  "design-tokens",        "~/Work/design-system/design-tokens",     "ts",     176, 96),
  proj("p7",  "svelte-playground",    "~/Code/experiments/svelte-playground",   "svelte", 209, 74),
  proj("p8",  "internal-tools",       "~/Work/internal-tools",                  "remix",  724, 41),
  proj("p9",  "blog-astro",           "~/Sites/blog-astro",                     "astro",  312, 23),
  proj("p10", "checkout-flow",        "~/Work/checkout-flow",                   "next",   587, 9),
  proj("p11", "ui-kit",               "~/Work/design-system/ui-kit",            "vite",   268, 4),
  proj("p12", "client-portal",        "~/Work/client-portal",                   "react",  496, 1),
];

// ---- formatting ----
function formatSize(bytes) {
  if (bytes >= 1024 * MB) return { value: (bytes / (1024 * MB)).toFixed(2), unit: "GB" };
  if (bytes >= MB) return { value: Math.round(bytes / MB).toString(), unit: "MB" };
  return { value: Math.max(1, Math.round(bytes / 1024)).toString(), unit: "KB" };
}
function formatSizeStr(bytes) { const s = formatSize(bytes); return `${s.value} ${s.unit}`; }

function relativeTime(ts) {
  const days = Math.floor((now - ts) / DAY);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 30) { const w = Math.round(days / 7); return `${w} week${w > 1 ? "s" : ""} ago`; }
  if (days < 365) { const m = Math.round(days / 30); return `${m} month${m > 1 ? "s" : ""} ago`; }
  const y = (days / 365); const yr = y < 1.5 ? 1 : Math.round(y);
  return `${yr} year${yr > 1 ? "s" : ""} ago`;
}
// staleness 0..1 (older = closer to 1), capped ~18 months
function staleness(ts) {
  const days = (now - ts) / DAY;
  return Math.max(0, Math.min(1, days / 540));
}

Object.assign(window, { MOCK_PROJECTS, formatSize, formatSizeStr, relativeTime, staleness, MB });
