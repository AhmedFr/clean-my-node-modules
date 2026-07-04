// Seeds tidydisk's two scan caches with a curated marketing dataset so the
// real app renders dream numbers for share-card captures, without
// re-installing or re-scanning anything. The target directory IS the app's
// real userData dir (dev and packaged builds share the same app name, so
// there is no separate "dev" location) — that is the whole point: seed it,
// take the screenshot in the actual app, then --restore to get your real
// data back. Mirrors the persisted shapes exactly:
//   src/main/projects/project-store.ts   -> projects-cache.json
//   src/main/pnpm-store/pnpm-store.ts    -> pnpm-store-cache.json
// Plain node ESM, zero deps. Precedent: scripts/make-icon.mjs.
//
// Usage:
//   node scripts/demo-data.mjs                    seed the tidydisk data dir
//   node scripts/demo-data.mjs --user-data <dir>   seed a different dir
//   node scripts/demo-data.mjs --restore           restore the real caches
//
// Run with: pnpm demo

import { existsSync, renameSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

const GB = 1024 * 1024 * 1024
const DAY_MS = 24 * 60 * 60 * 1000

// name, size (GB), FrameworkKind, days since last used, uniqueSize as a
// fraction of size. Fourteen projects, ~214 GB total, biggest ~38 GB, long
// tail; every FrameworkKind value is represented at least once.
const DEMO_PROJECTS = [
  { name: 'api-gateway', gb: 27, kind: 'node', daysAgo: 45, uniquePct: 0.62 },
  { name: 'legacy-dashboard', gb: 38, kind: 'vue', daysAgo: 400, uniquePct: 0.78 },
  { name: 'hackathon-2024', gb: 3.5, kind: 'remix', daysAgo: 240, uniquePct: 0.55 },
  { name: 'ecommerce-v2', gb: 32, kind: 'next', daysAgo: 210, uniquePct: 0.7 },
  { name: 'design-system', gb: 9.5, kind: 'react', daysAgo: 30, uniquePct: 0.6 },
  { name: 'mobile-app', gb: 16, kind: 'expo', daysAgo: 60, uniquePct: 0.82 },
  { name: 'analytics-pipeline', gb: 19, kind: 'node', daysAgo: 120, uniquePct: 0.68 },
  { name: 'docs-site', gb: 8, kind: 'astro', daysAgo: 270, uniquePct: 0.57 },
  { name: 'chat-prototype', gb: 6.5, kind: 'vite', daysAgo: 365, uniquePct: 0.74 },
  { name: 'ml-experiments', gb: 23, kind: 'ts', daysAgo: 330, uniquePct: 0.85 },
  { name: 'portfolio-2023', gb: 5, kind: 'svelte', daysAgo: 300, uniquePct: 0.65 },
  { name: 'admin-panel', gb: 11.5, kind: 'react', daysAgo: 150, uniquePct: 0.72 },
  { name: 'game-jam', gb: 1.5, kind: 'vite', daysAgo: 180, uniquePct: 0.58 },
  { name: 'microservice-auth', gb: 13.5, kind: 'node', daysAgo: 90, uniquePct: 0.8 },
]

function parseArgs(argv) {
  let userData = null
  let restore = false
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--restore') restore = true
    else if (arg === '--user-data') userData = argv[++i]
    else if (arg.startsWith('--user-data=')) userData = arg.slice('--user-data='.length)
  }
  return { userData, restore }
}

function buildProjects() {
  const home = homedir()
  const now = Date.now()
  return DEMO_PROJECTS.map((d, i) => {
    const size = Math.round(d.gb * GB)
    return {
      id: `demo-${i + 1}`,
      name: d.name,
      path: `~/dev/${d.name}`,
      absPath: join(home, 'dev', d.name),
      kind: d.kind,
      size,
      uniqueSize: Math.round(size * d.uniquePct),
      lastUsed: now - d.daysAgo * DAY_MS,
    }
  })
}

function buildPnpmStoreInfo() {
  const path = join(homedir(), 'Library', 'pnpm', 'store', 'v10')
  return {
    available: true,
    path,
    displayPath: '~/Library/pnpm/store/v10',
    sizeBytes: Math.round(33 * GB),
    checkedAt: Date.now(),
    source: 'pnpm',
    canPrune: true,
  }
}

function restoreCommand(targetDir, userData) {
  const base = 'node scripts/demo-data.mjs --restore'
  return userData ? `${base} --user-data ${targetDir}` : base
}

function doSeed(targetDir, userData, files) {
  const { projectsFile, projectsBak, storeFile, storeBak } = files
  const existingBaks = [projectsBak, storeBak].filter(existsSync)
  if (existingBaks.length > 0) {
    console.error('A demo backup already exists, refusing to overwrite it:')
    for (const bak of existingBaks) console.error(`  ${bak}`)
    console.error('Run this first, then re-run the seed:')
    console.error(`  ${restoreCommand(targetDir, userData)}`)
    process.exit(1)
  }

  const backedUp = []
  const noExistingFile = []
  for (const [live, bak, label] of [
    [projectsFile, projectsBak, 'projects-cache.json'],
    [storeFile, storeBak, 'pnpm-store-cache.json'],
  ]) {
    if (existsSync(live)) {
      renameSync(live, bak)
      backedUp.push(label)
    } else {
      noExistingFile.push(label)
    }
  }

  const projects = buildProjects()
  const totalSize = projects.reduce((sum, p) => sum + p.size, 0)
  writeFileSync(projectsFile, JSON.stringify({ projects, lastScanTime: Date.now() - 2 * 3600e3 }))

  const storeInfo = buildPnpmStoreInfo()
  writeFileSync(storeFile, JSON.stringify({ key: '|', info: storeInfo }))

  console.log(`Wrote ${projectsFile}`)
  console.log(`  ${projects.length} projects, ${(totalSize / GB).toFixed(1)} GB of node_modules total`)
  console.log(`Wrote ${storeFile}`)
  console.log(`  pnpm store, ${(storeInfo.sizeBytes / GB).toFixed(1)} GB`)
  if (backedUp.length > 0) console.log(`Backed up your real data first: ${backedUp.join(', ')}`)
  if (noExistingFile.length > 0) {
    console.log(`No existing file to back up for: ${noExistingFile.join(', ')} (none was present, nothing lost)`)
  }
  console.log('')
  console.log('Restart tidydisk, or hit Rescan, to see the demo data.')
  console.log('When you are done, restore your real data with:')
  console.log(`  ${restoreCommand(targetDir, userData)}`)
}

function doRestore(targetDir, userData, files) {
  const pairs = [
    { bak: files.projectsBak, live: files.projectsFile, label: 'projects-cache.json' },
    { bak: files.storeBak, live: files.storeFile, label: 'pnpm-store-cache.json' },
  ]
  const available = pairs.filter((p) => existsSync(p.bak))
  if (available.length === 0) {
    console.error(`No demo backups found in ${targetDir}.`)
    console.error('Nothing to restore. Run the seed command first if that is what you meant:')
    console.error(`  node scripts/demo-data.mjs${userData ? ` --user-data ${targetDir}` : ''}`)
    process.exit(1)
  }

  const missing = pairs.filter((p) => !available.includes(p))
  for (const p of available) {
    renameSync(p.bak, p.live)
    console.log(`Restored ${p.live}`)
  }
  for (const p of missing) {
    console.log(`No backup found for ${p.label}, left it as is`)
  }
  console.log('')
  console.log('Your real data is back in place.')
}

function main() {
  const { userData, restore } = parseArgs(process.argv.slice(2))
  const targetDir = userData ?? join(homedir(), 'Library', 'Application Support', 'tidydisk')

  if (!existsSync(targetDir)) {
    console.error(`tidydisk data folder not found at ${targetDir}.`)
    console.error('Launch the app at least once first, or pass --user-data <path> to target a different folder.')
    process.exit(1)
  }

  const files = {
    projectsFile: join(targetDir, 'projects-cache.json'),
    projectsBak: join(targetDir, 'projects-cache.json.bak'),
    storeFile: join(targetDir, 'pnpm-store-cache.json'),
    storeBak: join(targetDir, 'pnpm-store-cache.json.bak'),
  }

  if (restore) doRestore(targetDir, userData, files)
  else doSeed(targetDir, userData, files)
}

main()
