import type { Dictionary } from "../i18n.types";

// English reference dictionary. Copy is moved BYTE-FOR-BYTE from the current
// components — same words, same `<span className="text-accent">`, same
// `<code>`, apostrophes rendered as plain `'`. This is the source every other
// locale translates against; do not reword anything here.
export const en: Dictionary = {
  meta: {
    title:
      "TidyDisk: see what is eating your dev disk, reclaim it in one click",
    description:
      "TidyDisk lives in your macOS menu bar and shows what your dev projects really cost: every node_modules folder, your pnpm store and package-manager caches, Docker images and volumes, and every installed package. Free to scan. One-click cleanup with a 19 euro lifetime license. Safely, to the Trash, never rm -rf.",
    blogTitle: "TidyDisk blog: keeping dev disks clean",
    blogDescription:
      "Practical guides on node_modules cleanup, package manager disk usage, and reclaiming space on a developer Mac. From the makers of TidyDisk.",
    ogAlt:
      "TidyDisk: the macOS menu bar app that reclaims the disk your dev projects cost",
  },

  nav: {
    features: "Features",
    packages: "Packages",
    why: "Why",
    how: "How it works",
    download: "Download",
    blog: "Blog",
    github: "GitHub",
    getApp: "Get the app",
  },

  hero: {
    eyebrow: "macOS menu bar app · free scan",
    heading: (
      <>
        A <span className="text-accent">tidy disk</span>, without thinking
        about it.
      </>
    ),
    body: (
      <>
        Dev work quietly eats your Mac: heavy <code>node_modules</code>, Docker
        images, build caches, forgotten experiments. TidyDisk watches from the
        menu bar and gives the space back in one click. Safely, to the Trash,
        never <code>rm -rf</code>.
      </>
    ),
    downloadCta: "Download for macOS",
    githubCta: "View on GitHub",
    micro: "MIT-licensed · macOS 13+ · Apple Silicon & Intel",
  },

  band: {
    statement: (
      <>
        <code>node_modules</code> is the heaviest object in the known universe.
        But it is not alone: Docker images, build caches and dead projects pile
        up too. <em>TidyDisk clears all of it.</em>
      </>
    ),
  },

  areas: {
    kicker: "One tool, every kind of dev junk",
    heading: (
      <>
        Four places your disk quietly{" "}
        <span className="text-accent">fills up.</span>
      </>
    ),
    lead: "TidyDisk watches all of them and gives the space back, safely.",
    cards: [
      {
        title: "Projects",
        copy: "Heavy, stale node_modules ranked by the real bytes you would free.",
      },
      {
        title: "Caches",
        copy: "Your pnpm store and Docker build cache, pruned in one safe click.",
      },
      {
        title: "Packages",
        copy: "A machine-wide dependency inventory: version drift, duplicates, and security advisories.",
      },
      {
        title: "Docker",
        copy: "Images, volumes, containers and build cache, grouped by the project they belong to.",
      },
    ],
  },

  features: [
    {
      tagline: "Always watching",
      heading: "It watches your disk so you don't have to.",
      body: "TidyDisk lives in your menu bar and rescans on your schedule: every 6 hours, daily, or weekly. A native notification slides in the moment your node_modules cross the limit you set.",
      bullets: [
        "Background scans every 6 hours, daily, or weekly",
        "A threshold you set, in plain gigabytes",
        "One glance at the menu bar tells you where you stand",
      ],
    },
    {
      tagline: "Total clarity",
      heading: "Every dead dependency, ranked.",
      body: "Open the full launcher for a deep clean. Spotlight-style search across project names and paths, with every node_modules folder showing its real size and how long it's been since you touched it. The biggest, stalest offenders rise to the top.",
      bullets: [
        "Sort by last used, size, or project name",
        "Full keyboard navigation: ↑↓ to move, ↵ to open, ⌘⌫ to delete",
        "On pnpm, the real bytes you'd free, apart from what's linked into the shared store",
        "Reveal in Finder or open in your editor, one key away",
      ],
    },
    {
      tagline: "Safe payoff",
      heading: "One click. Gigabytes back. Nothing lost.",
      body: (
        <>
          Pick what you don&apos;t need and it goes to the Trash. No
          terminal, no <code>rm -rf</code> roulette, recoverable until you
          empty it. Watch the meter drop and your free space climb. Need a
          project again? A single <code>npm install</code> brings it right
          back.
        </>
      ),
      bullets: [
        <>
          Deletes to the Trash: recoverable, never <code>rm -rf</code>
        </>,
        "Delete one folder or sweep all the stale ones at once",
        "Only ever touches node_modules, never your source",
      ],
    },
    {
      tagline: "Whole-machine view",
      heading: "Every package you've installed, in one list.",
      body: "Open the Packages tab for a computer-wide inventory of every dependency your projects pull in: how many use it, its size, the versions you're on, the latest on npm, and any security advisories. Spot the heavy and unused, unify versions that have drifted apart, and see what's flagged, all from projects you've already scanned.",
      bullets: [
        "How many projects use each package, and its real size",
        <>
          A <b>unify</b> badge when one package is installed at several
          versions
        </>,
        "Latest-on-npm and security-advisory pills. Expand a row for per-version severity",
      ],
    },
    {
      tagline: "Beyond node_modules",
      heading: "Your Docker disk, grouped by project.",
      body: "Docker quietly hoards gigabytes in images, volumes, containers and build cache. Open the Docker tab to see it grouped by the project each resource belongs to, with real logos, sizes and in-use badges. Reclaim dangling images, stopped containers and unused volumes in a click, with the same safe confirmations as the rest of TidyDisk.",
      bullets: [
        "Images, volumes, containers and build cache, each with its real size",
        <>
          Resources <b>grouped by project</b> from Compose labels and used-by
          links
        </>,
        "Safe, typed confirmations before anything is permanently removed",
      ],
    },
  ],

  grid: {
    kicker: "Everything in one menu",
    heading: (
      <>
        Small app. <span className="text-accent">Big relief.</span>
      </>
    ),
    lead: "Your scans stay on your Mac. Anonymous usage analytics only, with a one-click opt-out in Settings. A quiet utility that keeps your disk honest.",
    cards: [
      {
        title: "Prune the pnpm store",
        copy: "Reclaim the shared store's dead versions with one safe click. It never deletes the store itself.",
      },
      {
        title: "Real vs linked sizing",
        copy: "On pnpm, see the bytes you'd actually free apart from what's linked into the shared store.",
      },
      {
        title: "Security advisories",
        copy: "A severity pill on any package with a known vulnerability, from the npm advisory database.",
      },
      {
        title: "Scheduled scans",
        copy: "Runs every 6 hours, daily, or weekly, entirely in the background.",
      },
      {
        title: "Threshold alerts",
        copy: "Set a limit in gigabytes and get nudged the instant you cross it.",
      },
      {
        title: "Pixel disk meter",
        copy: "A glanceable bar that fills and reddens as your dependencies pile up.",
      },
      {
        title: "Reveal in Finder",
        copy: "Jump straight to any project folder without leaving the keyboard.",
      },
      {
        title: "Open in your editor",
        copy: "One keystroke launches the project in the editor you already use.",
      },
      {
        title: "Framework detection",
        copy: "React, Next, Vue, Svelte, Node, Expo: each project, correctly tagged.",
      },
    ],
    comingSoonPill: "Coming soon",
    comingSoonText: (
      <>
        Next up: npm, yarn &amp; bun caches, plus per-project build outputs
        like <code>.next</code> and <code>dist</code>.
      </>
    ),
  },

  why: {
    kicker: "Why it piles up",
    heading: (
      <>
        The <span className="text-accent">node_modules</span> lifecycle.
      </>
    ),
    lead: "Every install writes your dependencies to disk. How much they pile up, and how much you can win back, comes down to your package manager.",
    npmTag: "a full copy per project",
    pnpmTag: "one shared store",
    npmNote: (
      <>
        Each project gets its <b>own full copy</b> of every dependency.
        Install <code>lodash</code> in ten projects and it&apos;s written
        to disk <b>ten times</b>. Multiply that across hundreds of
        transitive packages and the old projects you forgot about, and
        you&apos;re tens of gigabytes deep.
      </>
    ),
    pnpmNote: (
      <>
        pnpm keeps <b>one global store</b> and hard-links each project
        into it. A given version of a package lives on disk <b>once</b>,
        no matter how many projects use it, a huge saving.{" "}
        <b>But the store still grows</b> as new versions land and old
        ones linger.
      </>
    ),
    storeLabel: "· stored once",
    footNote: (
      <>
        TidyDisk works <b>both ends</b>: it trashes the stale project{" "}
        <code>node_modules</code> you&apos;ll never <code>npm install</code>{" "}
        again, <b>and</b> safely prunes your pnpm store of versions nothing
        links to anymore, one click in the <b>Caches</b> tab (it never
        deletes the store itself).
      </>
    ),
    sizingNote: (
      <>
        It&apos;s also why sizes look small on pnpm: TidyDisk counts the
        shared store <b>once</b> and shows you what&apos;s really yours to
        free, not the same bytes linked into a dozen projects.
      </>
    ),
  },

  how: {
    kicker: "How it works",
    heading: (
      <>
        Three steps to a <span className="text-accent">lighter Mac.</span>
      </>
    ),
    steps: [
      {
        num: "01",
        title: "Get it & it scans",
        body: "Download the signed .app, or clone the repo and build your own. The first scan maps every node_modules folder on your disk.",
        cmd: (
          <>
            <span className="pmt">$</span>pnpm install &amp;&amp; pnpm
            package
          </>
        ),
      },
      {
        num: "02",
        title: "Set your limit",
        body: "Pick a threshold in gigabytes and how often to rescan: every 6 hours, daily, or weekly. That's the entire setup.",
        cmd: (
          <>
            <span className="pmt">limit</span> 5 GB ·{" "}
            <span className="pmt">scan</span> daily
          </>
        ),
      },
      {
        num: "03",
        title: "Clean in a click",
        body: "When you cross the line, review the stale folders (or prune the pnpm store, or audit a heavy package) and reclaim the space. Your disk thanks you.",
        cmd: (
          <>
            <span className="pmt">↵</span> 2.71 GB moved to Trash
          </>
        ),
      },
    ],
  },

  download: {
    kicker: "Download",
    heading: (
      <>
        Free to scan. <span className="text-accent">19 euros to clean.</span>
      </>
    ),
    lead: "The scan is free forever and the source is MIT on GitHub. One-click cleanup is a one-time lifetime license: founding price 19 euros, then 29 after launch. 30-day money-back, no questions.",
    free: {
      name: (
        <>
          <span className="text-accent">$0</span> · Scan everything
        </>
      ),
      desc: "The scan, free forever.",
      bullets: [
        "Download and run, no setup required",
        "See every node_modules folder, cache, and package on your machine",
        "No account, ever",
      ],
      cta: "Download for macOS",
    },
    pro: {
      badge: "Founding price",
      name: (
        <>
          <span className="text-accent">€19</span> · Lifetime cleanup
        </>
      ),
      desc: "One-time license, unlocks cleanup for life.",
      bullets: [
        "One-click delete, straight to the Trash",
        "Clean stale: sweep every stale node_modules at once",
        "Prune your pnpm store, one click",
        "All future updates included",
        "Instant license key, delivered via Polar",
        "Founding price: 19 euros now, 29 euros after launch",
      ],
      cta: "Buy TidyDisk · €19",
    },
  },

  finalCta: {
    heading: (
      <>
        Stop hoarding
        <br />
        node_modules.
      </>
    ),
    body: "Reclaim the gigabytes your dependencies have been hoarding. Scan free, unlock cleanup for 19 euros.",
    downloadCta: "Download free scan",
    buyCta: "Buy · €19",
  },

  footer: {
    tagline: "The menu bar app that keeps dev junk from eating your Mac alive.",
    productHead: "Product",
    openSourceHead: "Open source",
    legalHead: "Legal",
    links: {
      feature: "Features",
      how: "How it works",
      download: "Download",
      blog: "Blog",
      repo: "GitHub repository",
      issues: "Issues",
      releases: "Releases",
      privacy: "Privacy Policy",
      legal: "Legal Notice",
      cookies: "Cookie preferences",
    },
    copyright: "© 2026 TidyDisk · MIT license",
    platform: "macOS 13+ · Apple Silicon & Intel",
  },

  blog: {
    eyebrow: "blog",
    listTitle: (
      <>
        Keeping dev disks <span className="text-accent">clean</span>
      </>
    ),
    listLead:
      "Practical guides on node_modules, package manager internals, and getting your disk space back. New article every week.",
    readArticle: "Read article",
    backToArticles: "← All articles",
    byline: "TidyDisk team",
    ctaTitle: "See what your projects really cost",
    ctaBody:
      "TidyDisk scans your Mac for free and shows every node_modules folder, sized and ranked. Cleanup is one click, always to the Trash.",
    ctaButton: "Download for macOS",
  },
};
