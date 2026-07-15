import { AppIcon } from '@renderer/components/AppIcon'
import { Kbd } from '@renderer/components/Kbd'
import { RescanHint } from '@renderer/components/RescanHint'
import { ResultView } from '@renderer/components/ResultView'
import { Row } from '@renderer/components/Row'
import type { SegmentedOption } from '@renderer/components/Segmented'
import { Segmented } from '@renderer/components/Segmented'
import { Spinner } from '@renderer/components/Spinner'
import { TabHeadline } from '@renderer/components/TabHeadline'
import { UIIcon } from '@renderer/components/UIIcon'
import { UnlockPrompt } from '@renderer/components/UnlockPrompt'
import { useAutoHeight } from '@renderer/hooks/useAutoHeight'
import { useDocker } from '@renderer/hooks/useDocker'
import { useLicense } from '@renderer/hooks/useLicense'
import { useLiveProjects } from '@renderer/hooks/useLiveProjects'
import { usePackagesTab } from '@renderer/hooks/usePackagesTab'
import { usePnpmStore } from '@renderer/hooks/usePnpmStore'
import { useProjects } from '@renderer/hooks/useProjects'
import { useScanProgress } from '@renderer/hooks/useScanProgress'
import { useSettings } from '@renderer/hooks/useSettings'
import { useToast } from '@renderer/hooks/useToast'
import { mixColor, statusColor } from '@renderer/lib/colors'
import { formatSizeStr, GB } from '@renderer/lib/format'
import { severityCounts } from '@renderer/lib/severity'
import { DOCKER_STALE_MS } from '@renderer/lib/staleness'
import type { DockerItem, DockerPruneTarget } from '@shared/docker.types'
import type { LauncherNavTarget } from '@shared/launcher-nav.types'
import type { PackageEntry } from '@shared/package.types'
import type { Project } from '@shared/project.types'
import { type ReactNode, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { CachesView } from '../views/CachesView'
import { type LiveCache, selectedActionableCache } from '../views/CachesView.constants'
import { DockerView } from '../views/DockerView'
import type { DockerSortKey } from '../views/DockerView.constants'
import { dockerBuildCacheBytes, PRUNE_TARGET_LABEL, pruneEstimateBytes } from '../views/DockerView.constants'
import { confirmSatisfied, needsTypedConfirm, requiredConfirmText } from '../views/docker-confirm'
import { EmptyView } from '../views/EmptyView'
import { Onboarding } from '../views/Onboarding'
import { PackagesView } from '../views/PackagesView'
import { ScanningView } from '../views/ScanningView'
import { SettingsView } from '../views/SettingsView'
import type { DockerConfirmState, LauncherTab, LauncherToast, LauncherView, SortKey } from './LauncherApp.types'
import { launcherNavState } from './launcherNav'
import { SortTab } from './SortTab'
import { tabSummary } from './tabSummary'

const NEXT_SCAN_LABEL: Record<string, string> = {
  '6h': '6 hours',
  daily: '18 hours',
  weekly: '5 days',
}

/** How many project rows stay visible before the list scrolls. */
const VISIBLE_ROWS = 7
/** Gap between rows, in px (kept in sync with the list container's flex gap). */
const ROW_GAP = 4
/** Vertical padding of the .cc-list container, in px (matches global.css). */
const LIST_PADDING = 6

export function LauncherApp(): ReactNode {
  const [settings, setSetting, settingsLoaded] = useSettings()
  const { license, activate: activateLicense } = useLicense()
  const projects = useProjects()
  const liveById = useLiveProjects()
  const accent = settings.accent
  const threshold = settings.thresholdGB * GB

  const [query, setQuery] = useState('')
  const [sortBy, setSortBy] = useState<SortKey>('used')
  const [dockerSortBy, setDockerSortBy] = useState<DockerSortKey>('size')
  const [sel, setSel] = useState(0)
  const [view, setView] = useState<LauncherView>('list')
  const [tab, setTab] = useState<LauncherTab>('projects')
  const [deleting, setDeleting] = useState<Set<string>>(() => new Set())
  const [confirm, setConfirm] = useState<Project | null>(null)
  const [dockerConfirm, setDockerConfirm] = useState<DockerConfirmState | null>(null)
  const [dockerTyped, setDockerTyped] = useState('')
  const [unlock, setUnlock] = useState<{ bytes?: number } | null>(null)
  const [reclaimed, setReclaimed] = useState(0)
  const [cardCopied, setCardCopied] = useState(false)
  const { toast, flashToast } = useToast<LauncherToast>()
  const { store, loading: storeLoading, pruning, prune, refresh } = usePnpmStore()
  const dockerEnabled = settings.docker !== false
  const tabOptions = useMemo<SegmentedOption<LauncherTab>[]>(
    () => [
      { value: 'projects', label: 'Projects' },
      { value: 'caches', label: 'Caches' },
      { value: 'packages', label: 'Packages' },
      ...(dockerEnabled ? [{ value: 'docker', label: 'Docker' } as const] : []),
    ],
    [dockerEnabled],
  )
  const docker = useDocker()
  const pkgActive = view === 'list' && tab === 'packages'
  const {
    inventory,
    computing: pkgComputing,
    sortBy: pkgSortBy,
    setSortBy: setPkgSortBy,
    filtered: pkgFiltered,
    expandedName: expandedPkg,
    toggleExpand: togglePkgExpand,
    collapse: collapsePkg,
    refresh: refreshPackages,
  } = usePackagesTab(query, pkgActive)
  const scanProgress = useScanProgress()
  // Background work that grows the disk total after launch: a running scan, or the
  // pnpm store size still being measured (a du that can take a few seconds).
  const scanning = !!scanProgress && !scanProgress.done
  const calculating = storeLoading || scanning

  // The pnpm store can change during a scan (new installs), so re-size it once a
  // scan finishes. The cached size shows instantly meanwhile; this refreshes it.
  const wasScanning = useRef(false)
  useEffect(() => {
    if (wasScanning.current && !scanning) void refresh()
    wasScanning.current = scanning
  }, [scanning, refresh])

  // The menu-bar settings entry opens the launcher straight to Settings: pull any
  // target queued for this (possibly fresh) window on mount, and listen for live
  // navigation when the already-open window is reopened onto Settings.
  const applyNav = useCallback((nav: LauncherNavTarget | null): void => {
    if (!nav) return
    const next = launcherNavState(nav)
    setView(next.view)
    if (next.tab) setTab(next.tab)
  }, [])
  useEffect(() => {
    void window.clean.consumeLauncherNav().then(applyNav)
    return window.clean.onLauncherNavigate(applyNav)
  }, [applyNav])
  // If the user disables Docker while on that tab, fall back to Projects so the
  // hidden tab can't stay selected via keyboard or stale state.
  useEffect(() => {
    if (!dockerEnabled && tab === 'docker') {
      setTab('projects')
      setSel(0)
    }
  }, [dockerEnabled, tab])

  // Docker refreshes on its own cadence, decoupled from the disk rescan: when the
  // Docker tab opens with missing or stale (>5 min) data, kick a background scan.
  // Guarded on `docker.loading` and freshened `checkedAt` so it can't loop.
  useEffect(() => {
    if (view !== 'list' || (tab !== 'docker' && tab !== 'caches') || !dockerEnabled || docker.loading) return
    const stale = !docker.info || Date.now() - docker.info.checkedAt > DOCKER_STALE_MS
    if (stale) void docker.refresh()
  }, [view, tab, dockerEnabled, docker.info, docker.loading, docker.refresh])

  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const rowEls = useRef<Record<string, HTMLDivElement>>({})
  const rootRef = useRef<HTMLDivElement>(null)
  useAutoHeight(rootRef)

  // "Real" disk: each project's own freeable bytes plus the pnpm store counted once
  // (package content shared across projects lives in the store, never double-counted).
  const storeBytes = store?.available ? store.sizeBytes : 0
  const totalUsed = useMemo(
    () => projects.reduce((a, p) => a + (p.uniqueSize ?? p.size), 0) + storeBytes,
    [projects, storeBytes],
  )
  const linkedTotal = useMemo(
    () => projects.reduce((a, p) => a + (p.uniqueSize !== undefined ? p.size - p.uniqueSize : 0), 0),
    [projects],
  )
  const needsRescan = useMemo(() => projects.some((p) => p.uniqueSize === undefined), [projects])
  const maxBytes = useMemo(() => Math.max(1, ...projects.map((p) => p.uniqueSize ?? p.size)), [projects])
  // Bar scale for the Docker rows' SizeViz. Excludes build-cache items: they no longer render
  // in the Docker tab (they live in the Caches tab), so counting them here would scale every
  // visible row against an off-screen max and silently compress the bars.
  const dockerMaxBytes = useMemo(
    () => Math.max(1, ...(docker.info?.items.filter((i) => i.kind !== 'buildcache').map((i) => i.sizeBytes) ?? [])),
    [docker.info],
  )
  const dockerTotal = useMemo(() => (docker.info?.totals ?? []).reduce((s, t) => s + t.sizeBytes, 0), [docker.info])
  const severity = useMemo(() => severityCounts(inventory?.packages ?? []), [inventory])
  const packagesDataReady = !!inventory && !inventory.enrichmentError
  const cachesAvailable = !!store?.available
  const dockerAvailable = !!docker.info?.available
  const buildCacheBytes = useMemo(
    () => (dockerAvailable ? dockerBuildCacheBytes(docker.info?.items ?? []) : 0),
    [dockerAvailable, docker.info],
  )
  const ratio = totalUsed / threshold
  const status = statusColor(ratio, accent)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const arr = projects.filter((p) => !q || p.name.toLowerCase().includes(q) || p.path.toLowerCase().includes(q))
    return [...arr].sort((a, b) => {
      if (sortBy === 'size') return (b.uniqueSize ?? b.size) - (a.uniqueSize ?? a.size)
      if (sortBy === 'name') return a.name.localeCompare(b.name)
      return a.lastUsed - b.lastUsed // oldest first
    })
  }, [projects, query, sortBy])

  useEffect(() => {
    if (sel >= filtered.length) setSel(Math.max(0, filtered.length - 1))
  }, [filtered.length, sel])

  const openNpm = useCallback(
    (entry: PackageEntry | undefined) => {
      if (!entry) return
      void window.clean.openExternal(`https://www.npmjs.com/package/${entry.name}`)
      flashToast({ icon: UIIcon.externalLink, text: `Opening ${entry.name} on npm…`, tone: 'neutral' })
    },
    [flashToast],
  )

  // Cap the list height to VISIBLE_ROWS by measuring a real row, so the count
  // holds across densities and the window stays short enough to show the footer.
  const [listMaxH, setListMaxH] = useState<number>()
  useLayoutEffect(() => {
    const first = filtered.find((p) => !deleting.has(p.id))
    const el = first && rowEls.current[first.id]
    const rowH = el?.offsetHeight
    if (!rowH) return
    const peek = Math.round(rowH * 0.3) // sliver of the next row hints at scrolling
    setListMaxH(VISIBLE_ROWS * rowH + (VISIBLE_ROWS - 1) * ROW_GAP + LIST_PADDING * 2 + peek)
  }, [filtered, deleting, settings.density, settings.sizeStyle])

  // sliding highlight (projects list only)
  const [hl, setHl] = useState({ top: 0, height: 0, on: false })
  useLayoutEffect(() => {
    if (view !== 'list' || tab !== 'projects') {
      setHl((h) => ({ ...h, on: false }))
      return
    }
    const p = filtered[sel]
    const el = p && rowEls.current[p.id]
    if (el) setHl({ top: el.offsetTop, height: el.offsetHeight, on: true })
    else setHl((h) => ({ ...h, on: false }))
  }, [sel, filtered, view, tab, settings.density, settings.sizeStyle, query])

  const doOpen = useCallback(
    (p: Project | undefined) => {
      if (!p) return
      void window.clean.openProject(p.id)
      flashToast({ icon: UIIcon.chevronRight, text: `Opening ${p.name} in your editor…`, tone: 'neutral' })
    },
    [flashToast],
  )

  const doFinder = useCallback(
    (p: Project | undefined) => {
      if (!p) return
      void window.clean.revealInFinder(p.id)
      flashToast({ icon: UIIcon.finder, text: `Revealing ${p.name} in Finder…`, tone: 'neutral' })
    },
    [flashToast],
  )

  const commitDelete = useCallback(
    (p: Project) => {
      if (!license.pro) {
        setConfirm(null)
        setUnlock({ bytes: p.uniqueSize ?? p.size })
        window.clean.trackEvent('paywall_shown', {
          trigger: 'delete',
          teased_gb: Math.round(((p.uniqueSize ?? p.size) / GB) * 10) / 10,
        })
        return
      }
      setConfirm(null)
      setDeleting((s) => new Set(s).add(p.id))
      void window.clean.deleteNodeModules(p.id).then(({ freed, blocked }) => {
        // Always clear the exit-animation state, even on a refused delete, so a
        // still-present row (e.g. a live project) is restored rather than left
        // stuck invisible.
        setDeleting((s) => {
          const n = new Set(s)
          n.delete(p.id)
          return n
        })
        if (blocked === 'live') {
          flashToast({ icon: UIIcon.trash, text: `Cannot delete, ${p.name} is running`, tone: 'neutral' })
          return
        }
        if (blocked === 'unmounted') {
          flashToast({ icon: UIIcon.trash, text: `Could not delete ${p.name}, drive not connected`, tone: 'neutral' })
          return
        }
        if (blocked) return
        setReclaimed((r) => r + freed)
        flashToast({
          icon: UIIcon.checkCircle,
          text: `Reclaimed ${formatSizeStr(freed || (p.uniqueSize ?? p.size))} · ${p.name}`,
          tone: 'good',
        })
      })
    },
    [flashToast, license.pro],
  )

  const closeDockerConfirm = useCallback(() => {
    setDockerConfirm(null)
    setDockerTyped('')
  }, [])

  // Disabling Docker mid-confirm must not leave a pending remove/prune dialog wired to a
  // now-hidden feature. The tab reset above misses a build-cache prune requested from the
  // Caches tab (tab !== 'docker'), so clear any pending Docker confirm whenever Docker is
  // turned off, regardless of the active tab.
  useEffect(() => {
    if (!dockerEnabled) closeDockerConfirm()
  }, [dockerEnabled, closeDockerConfirm])

  // Free users hit the paywall before any confirm state is set — the destructive IPC
  // is also gated pro-only in main, but the UI never even offers the affordance here.
  const requestDockerRemove = useCallback(
    (item: DockerItem) => {
      if (!license.pro) {
        setUnlock({ bytes: item.sizeBytes })
        window.clean.trackEvent('paywall_shown', { trigger: 'docker' })
        return
      }
      setDockerTyped('')
      setDockerConfirm({ kind: 'remove', item })
    },
    [license.pro],
  )

  const requestDockerPrune = useCallback(
    (target: DockerPruneTarget) => {
      if (!license.pro) {
        setUnlock({})
        window.clean.trackEvent('paywall_shown', { trigger: 'docker' })
        return
      }
      setDockerTyped('')
      setDockerConfirm({ kind: 'prune', target, estimatedBytes: pruneEstimateBytes(docker.info?.items ?? [], target) })
    },
    [license.pro, docker.info],
  )

  const commitDockerRemove = useCallback(
    (item: DockerItem) => {
      closeDockerConfirm()
      void docker.remove(item.kind, item.id).then((r) => {
        if (r.ok) {
          flashToast({
            icon: UIIcon.checkCircle,
            text: `Reclaimed ${formatSizeStr(r.freedBytes || item.sizeBytes)} · ${item.name}`,
            tone: 'good',
          })
        } else {
          flashToast({
            icon: UIIcon.alert,
            text: `Couldn't remove ${item.name}. It may now be in use.`,
            tone: 'neutral',
          })
        }
      })
    },
    [docker, flashToast, closeDockerConfirm],
  )

  const commitDockerPrune = useCallback(
    (target: DockerPruneTarget, estimatedBytes: number) => {
      closeDockerConfirm()
      void docker.prune(target).then((r) => {
        if (r.ok) {
          flashToast({
            icon: UIIcon.checkCircle,
            text: `Reclaimed ${formatSizeStr(r.freedBytes || estimatedBytes)} · ${PRUNE_TARGET_LABEL[target]}`,
            tone: 'good',
          })
        } else {
          flashToast({
            icon: UIIcon.alert,
            text: "Couldn't prune. Nothing was removed.",
            tone: 'neutral',
          })
        }
      })
    },
    [docker, flashToast, closeDockerConfirm],
  )

  // Derived confirm-gate state for the docker confirm footer: only volumes (per-item or the
  // bulk unusedVolumes prune) need the extra typed confirmation before Remove/↵ can fire.
  const dockerNeedsTyped = dockerConfirm
    ? dockerConfirm.kind === 'remove'
      ? needsTypedConfirm({ kind: dockerConfirm.item.kind })
      : dockerConfirm.target === 'unusedVolumes'
    : false
  const dockerRequiredText = dockerConfirm
    ? dockerConfirm.kind === 'remove'
      ? requiredConfirmText({ kind: 'volume', name: dockerConfirm.item.name })
      : requiredConfirmText({ kind: 'prune' })
    : ''
  const dockerConfirmBlocked = dockerNeedsTyped && !confirmSatisfied(dockerRequiredText, dockerTyped)

  const commitDockerConfirm = useCallback(() => {
    if (!dockerConfirm || dockerConfirmBlocked) return
    if (dockerConfirm.kind === 'remove') commitDockerRemove(dockerConfirm.item)
    else commitDockerPrune(dockerConfirm.target, dockerConfirm.estimatedBytes)
  }, [dockerConfirm, dockerConfirmBlocked, commitDockerRemove, commitDockerPrune])

  const rescan = useCallback(() => setView('scanning'), [])

  const copyCard = useCallback(
    (source: 'reveal' | 'header') => {
      void window.clean
        .copyShareCard({
          totalBytes: totalUsed,
          nodeModulesBytes: Math.max(0, totalUsed - storeBytes),
          storeBytes,
          projectsCount: projects.length,
          source,
        })
        .then(({ ok }) => {
          if (!ok) return
          setCardCopied(true)
          setTimeout(() => setCardCopied(false), 2200)
          if (source === 'header') {
            flashToast({ icon: UIIcon.checkCircle, text: 'Image copied. Paste it anywhere.', tone: 'good' })
          }
        })
    },
    [totalUsed, storeBytes, projects.length, flashToast],
  )

  const handlePrune = useCallback(async () => {
    if (!license.pro) {
      setUnlock({})
      window.clean.trackEvent('paywall_shown', { trigger: 'prune' })
      return
    }
    const res = await prune()
    if (res?.ok) {
      flashToast({
        icon: UIIcon.checkCircle,
        text: `Reclaimed ${formatSizeStr(res.freedBytes)} · pnpm store`,
        tone: 'good',
      })
    }
  }, [prune, flashToast, license.pro])

  const liveCaches = useMemo<LiveCache[]>(() => {
    const list: LiveCache[] = [
      {
        id: 'pnpm',
        icon: UIIcon.hdd,
        name: 'pnpm store',
        detail: pruning
          ? 'Pruning unreferenced packages…'
          : store?.available
            ? (store?.displayPath ?? '')
            : (store?.reason ?? 'pnpm store not found'),
        size: store?.available ? store?.sizeBytes : undefined,
        disabled: !store?.available,
        busy: pruning,
        actionLabel: store?.canPrune ? 'Prune' : undefined,
        onAction: handlePrune,
      },
    ]
    if (dockerEnabled && dockerAvailable && buildCacheBytes > 0) {
      list.push({
        id: 'docker-buildcache',
        icon: UIIcon.hdd,
        name: 'Docker build cache',
        detail: 'Docker layer build cache',
        size: buildCacheBytes,
        busy: docker.busyId === 'prune:buildCache',
        actionLabel: 'Delete',
        busyLabel: 'Deleting…',
        danger: true,
        title: 'Delete all Docker build cache. Permanent, not sent to the Trash.',
        onAction: () => requestDockerPrune('buildCache'),
      })
    }
    return list
  }, [store, pruning, handlePrune, dockerEnabled, dockerAvailable, buildCacheBytes, docker.busyId, requestDockerPrune])

  // keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      const meta = e.metaKey || e.ctrlKey
      if (meta && e.key === ',') {
        e.preventDefault()
        setView((v) => (v === 'settings' ? 'list' : 'settings'))
        setConfirm(null)
        closeDockerConfirm()
        setUnlock(null)
        return
      }
      if (meta && (e.key === 'r' || e.key === 'R')) {
        e.preventDefault()
        if (tab === 'packages') void refreshPackages()
        else if (tab === 'docker') {
          closeDockerConfirm()
          void docker.refresh()
        } else rescan()
        return
      }
      if (meta && ['1', '2', '3', '4'].includes(e.key)) {
        if (e.key === '4' && !dockerEnabled) return
        e.preventDefault()
        setTab(e.key === '1' ? 'projects' : e.key === '2' ? 'caches' : e.key === '3' ? 'packages' : 'docker')
        setSel(0)
        setConfirm(null)
        closeDockerConfirm()
        setUnlock(null)
        collapsePkg()
        return
      }
      if (e.key === 'Escape') {
        if (unlock) {
          setUnlock(null)
          return
        }
        if (view === 'result') {
          setView('list')
          return
        }
        if (confirm) {
          setConfirm(null)
          return
        }
        if (dockerConfirm) {
          closeDockerConfirm()
          return
        }
        if (view === 'list' && tab === 'packages' && expandedPkg) {
          collapsePkg()
          return
        }
        if (view !== 'list') {
          setView('list')
          return
        }
        if (query) {
          setQuery('')
          return
        }
        void window.clean.closeWindow()
        return
      }
      if (confirm) {
        if (e.key === 'Enter') {
          e.preventDefault()
          commitDelete(confirm)
        }
        return
      }
      if (dockerConfirm) {
        // A blocked confirm (typed volume name not yet matching) still swallows Enter —
        // an accidental keypress must never fall through to a destructive action.
        if (e.key === 'Enter') {
          e.preventDefault()
          commitDockerConfirm()
        }
        return
      }
      if (view !== 'list') return
      if (tab === 'caches') {
        const cacheCount = liveCaches.length
        if (e.key === 'ArrowDown') {
          e.preventDefault()
          setSel((s) => Math.min(cacheCount - 1, s + 1))
        } else if (e.key === 'ArrowUp') {
          e.preventDefault()
          setSel((s) => Math.max(0, s - 1))
        } else if (e.key === 'Enter') {
          e.preventDefault()
          // Guard on visibility: `sel` indexes the full list, but a query may have filtered
          // the selected row off screen — Enter must never fire a row the user can't see.
          selectedActionableCache(liveCaches, query, sel)?.onAction?.()
        }
        return
      }
      if (tab === 'docker') {
        // Row-level remove/prune is mouse-driven (per-item and per-category buttons in
        // DockerView); this just keeps Arrow/Enter/⌘⌫ from falling through to the
        // projects-list logic below. The dockerConfirm branch above is what drives ↵/esc
        // once a removal is pending.
        return
      }
      if (tab === 'packages') {
        if (e.key === 'ArrowDown') {
          e.preventDefault()
          setSel((s) => Math.min(pkgFiltered.length - 1, s + 1))
        } else if (e.key === 'ArrowUp') {
          e.preventDefault()
          setSel((s) => Math.max(0, s - 1))
        } else if (e.key === 'Enter') {
          e.preventDefault()
          const p = pkgFiltered[sel]
          if (!p) return
          // ⌘↵ opens npm; plain ↵ toggles the detail panel.
          if (meta) openNpm(p)
          else togglePkgExpand(p.name)
        }
        return
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSel((s) => Math.min(filtered.length - 1, s + 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSel((s) => Math.max(0, s - 1))
      } else if (e.key === 'Enter') {
        e.preventDefault()
        doOpen(filtered[sel])
      } else if (meta && e.key === 'Backspace') {
        e.preventDefault()
        const p = filtered[sel]
        if (p) setConfirm(p)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [
    filtered,
    sel,
    view,
    tab,
    confirm,
    dockerConfirm,
    closeDockerConfirm,
    commitDockerConfirm,
    unlock,
    query,
    commitDelete,
    doOpen,
    rescan,
    liveCaches,
    pkgFiltered,
    openNpm,
    refreshPackages,
    expandedPkg,
    togglePkgExpand,
    collapsePkg,
    docker,
    dockerEnabled,
  ])

  // The window is hidden (not destroyed) on blur/esc, so it keeps its React
  // state. Reset to a clean search every time it regains focus, like Spotlight.
  useEffect(() => {
    const onFocus = (): void => {
      setView('list')
      setTab('projects')
      setConfirm(null)
      closeDockerConfirm()
      setUnlock(null)
      setQuery('')
      setSel(0)
      collapsePkg()
      requestAnimationFrame(() => inputRef.current?.focus())
    }
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [collapsePkg, closeDockerConfirm])

  // keep selected row in view (projects list only)
  useEffect(() => {
    if (view !== 'list' || tab !== 'projects') return
    const p = filtered[sel]
    const el = p && rowEls.current[p.id]
    const c = listRef.current
    if (el && c) {
      const top = el.offsetTop
      const bot = top + el.offsetHeight
      if (top < c.scrollTop) c.scrollTop = top - 6
      else if (bot > c.scrollTop + c.clientHeight) c.scrollTop = bot - c.clientHeight + 6
    }
  }, [sel, view, tab, filtered])

  const isEmpty = projects.length === 0
  const summaryText = tabSummary({
    tab,
    projectsUsed: totalUsed,
    cachesUsed: storeBytes,
    cachesAvailable,
    dockerUsed: dockerTotal,
    dockerAvailable,
    thresholdGB: settings.thresholdGB,
    cacheThresholdGB: settings.cacheThresholdGB,
    dockerThresholdGB: settings.dockerThresholdGB,
    severity,
    packagesCheckEnabled: settings.checkUpdates,
    packagesComputing: pkgComputing,
    packagesDataReady,
  })
  const summaryOver =
    tab === 'projects'
      ? totalUsed > threshold
      : tab === 'caches'
        ? cachesAvailable && storeBytes > settings.cacheThresholdGB * GB
        : tab === 'docker'
          ? dockerAvailable && dockerTotal > settings.dockerThresholdGB * GB
          : severity.vulnerable > 0
  // The disk spinner only makes sense on the size tabs that background-calculate.
  const showCalcSpinner = calculating && (tab === 'projects' || tab === 'caches')
  const showSummary = !!summaryText && !(tab === 'projects' && isEmpty)

  return (
    <div
      ref={rootRef}
      className="cc-window"
      style={{
        boxShadow: `inset 0 0 0 1px var(--surface-1)${
          ratio > 0.85 ? `, 0 0 60px -10px ${mixColor(status, 'rgba(0,0,0,0)', 0.45)}` : ''
        }`,
      }}
    >
      {!settingsLoaded ? null : !settings.onboarded ? (
        <Onboarding
          settings={settings}
          setSetting={setSetting}
          accent={accent}
          onComplete={() => {
            setView('scanning')
            setSetting('onboarded', true)
          }}
        />
      ) : (
        <>
          {/* ---------- Header ---------- */}
          {view === 'list' ? (
            <div className="cc-header">
              <AppIcon accent={accent} />
              <input
                ref={inputRef}
                className="cc-input"
                autoFocus
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value)
                  setSel(0)
                }}
                placeholder={
                  tab === 'projects'
                    ? 'Search node_modules by project or path…'
                    : tab === 'packages'
                      ? 'Search packages…'
                      : tab === 'docker'
                        ? 'Search Docker…'
                        : 'Search caches…'
                }
              />
              <TabHeadline
                tab={tab}
                accent={accent}
                projectsUsed={totalUsed}
                linkedBytes={linkedTotal}
                projectsCalculating={calculating}
                thresholdGB={settings.thresholdGB}
                cachesUsed={storeBytes}
                cachesAvailable={cachesAvailable}
                cachesCalculating={storeLoading}
                cacheThresholdGB={settings.cacheThresholdGB}
                dockerUsed={dockerTotal}
                dockerAvailable={dockerAvailable}
                dockerThresholdGB={settings.dockerThresholdGB}
                severity={severity}
                packagesTotal={inventory?.packages.length ?? 0}
                packagesCheckEnabled={settings.checkUpdates}
                packagesComputing={pkgComputing}
                packagesDataReady={packagesDataReady}
              />
              {totalUsed > 0 && (
                <button className="cc-iconbtn" title="Copy your scan as an image" onClick={() => copyCard('header')}>
                  {UIIcon.share({ size: 15 })}
                </button>
              )}
              <button
                className="cc-close"
                onClick={() => void window.clean.closeWindow()}
                title="Close (esc)"
                aria-label="Close"
              >
                {UIIcon.x({ size: 14 })}
              </button>
            </div>
          ) : (
            <div className="cc-header">
              <button className="cc-back" onClick={() => setView('list')} aria-label="Back">
                {UIIcon.chevronLeft({ size: 18 })}
              </button>
              <div style={{ fontSize: 14.5, fontWeight: 650, color: 'var(--text)' }}>
                {view === 'settings' ? 'Settings' : view === 'result' ? 'Results' : 'Scanning'}
              </div>
              <div style={{ flex: 1 }} />
              <button
                className="cc-close"
                onClick={() => void window.clean.closeWindow()}
                title="Close (esc)"
                aria-label="Close"
              >
                {UIIcon.x({ size: 14 })}
              </button>
            </div>
          )}
          <div className="cc-divider" />

          {/* ---------- Body ---------- */}
          {view === 'scanning' && (
            <ScanningView accent={accent} onDone={() => setView(totalUsed > 0 ? 'result' : 'list')} />
          )}
          {view === 'result' && (
            <ResultView
              accent={accent}
              totalBytes={totalUsed}
              nodeModulesBytes={Math.max(0, totalUsed - storeBytes)}
              storeBytes={storeBytes}
              projectsCount={projects.length}
              copied={cardCopied}
              onCopy={() => copyCard('reveal')}
              onContinue={() => setView('list')}
            />
          )}
          {view === 'settings' && (
            <SettingsView
              settings={settings}
              setSetting={setSetting}
              accent={accent}
              store={store}
              onRefreshStore={() => void refresh()}
              license={license}
              activateLicense={activateLicense}
            />
          )}
          {view === 'list' && (
            <>
              <div className="cc-listhead">
                <Segmented
                  small
                  accent={accent}
                  value={tab}
                  onChange={(t) => {
                    setTab(t)
                    setSel(0)
                    setConfirm(null)
                    closeDockerConfirm()
                    setUnlock(null)
                    collapsePkg()
                  }}
                  options={tabOptions}
                />
                {tab === 'projects' && !isEmpty && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <span style={{ fontSize: 11, color: 'var(--text-faint)', marginRight: 4 }}>Sort</span>
                    <SortTab label="Last used" active={sortBy === 'used'} onClick={() => setSortBy('used')} />
                    <SortTab label="Size" active={sortBy === 'size'} onClick={() => setSortBy('size')} />
                    <SortTab label="Name" active={sortBy === 'name'} onClick={() => setSortBy('name')} />
                  </div>
                )}
                {tab === 'packages' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <span style={{ fontSize: 11, color: 'var(--text-faint)', marginRight: 4 }}>Sort</span>
                    <SortTab label="Used" active={pkgSortBy === 'used'} onClick={() => setPkgSortBy('used')} />
                    <SortTab label="Size" active={pkgSortBy === 'size'} onClick={() => setPkgSortBy('size')} />
                    <SortTab label="Name" active={pkgSortBy === 'name'} onClick={() => setPkgSortBy('name')} />
                    <SortTab label="Updates" active={pkgSortBy === 'updates'} onClick={() => setPkgSortBy('updates')} />
                  </div>
                )}
                {tab === 'docker' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <span style={{ fontSize: 11, color: 'var(--text-faint)', marginRight: 4 }}>Sort</span>
                    <SortTab label="Size" active={dockerSortBy === 'size'} onClick={() => setDockerSortBy('size')} />
                    <SortTab label="Name" active={dockerSortBy === 'name'} onClick={() => setDockerSortBy('name')} />
                    <SortTab
                      label="Recent"
                      active={dockerSortBy === 'recent'}
                      onClick={() => setDockerSortBy('recent')}
                    />
                  </div>
                )}
              </div>
              {tab === 'packages' ? (
                <PackagesView
                  items={pkgFiltered}
                  totalCount={inventory?.packages.length ?? 0}
                  computedAt={inventory?.computedAt}
                  computing={pkgComputing}
                  checkUpdates={settings.checkUpdates}
                  enrichmentError={inventory?.enrichmentError}
                  query={query}
                  selectedIndex={sel}
                  expandedName={expandedPkg}
                  onSelectIndex={setSel}
                  onToggleExpand={togglePkgExpand}
                  onOpen={openNpm}
                  onRefresh={() => void refreshPackages()}
                />
              ) : tab === 'caches' ? (
                <CachesView caches={liveCaches} selectedIndex={sel} query={query} onSelectIndex={setSel} />
              ) : tab === 'docker' && dockerEnabled ? (
                <DockerView
                  info={docker.info}
                  loading={docker.loading}
                  query={query}
                  sortBy={dockerSortBy}
                  onRefresh={() => void docker.refresh()}
                  busyId={docker.busyId}
                  onRemove={requestDockerRemove}
                  onPrune={requestDockerPrune}
                  accent={accent}
                  density={settings.density}
                  sizeStyle={settings.sizeStyle}
                  maxBytes={dockerMaxBytes}
                />
              ) : isEmpty ? (
                <EmptyView
                  reclaimedTotal={reclaimed}
                  nextScanLabel={NEXT_SCAN_LABEL[settings.scanInterval] ?? null}
                  accent={accent}
                />
              ) : (
                <>
                  {needsRescan && <RescanHint accent={accent} onRescan={rescan} />}
                  <div ref={listRef} className="cc-list" style={listMaxH ? { maxHeight: listMaxH } : undefined}>
                    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: ROW_GAP }}>
                      <div
                        className="cc-hl"
                        style={{
                          top: hl.top,
                          height: hl.height,
                          opacity: hl.on ? 1 : 0,
                          background: 'var(--surface-2)',
                          boxShadow: 'inset 0 0 0 1px var(--hairline)',
                        }}
                      />
                      {filtered.length === 0 ? (
                        <div
                          style={{
                            padding: '40px 20px',
                            textAlign: 'center',
                            color: 'var(--text-dim)',
                            fontSize: 13,
                          }}
                        >
                          No folders match “{query}”.
                        </div>
                      ) : (
                        filtered.map((p, i) => (
                          <Row
                            key={p.id}
                            p={p}
                            selected={i === sel}
                            density={settings.density}
                            sizeStyle={settings.sizeStyle}
                            maxBytes={maxBytes}
                            accent={accent}
                            deleting={deleting.has(p.id)}
                            live={liveById[p.id]}
                            rowRef={(el) => {
                              if (el) rowEls.current[p.id] = el
                            }}
                            onSelect={() => setSel(i)}
                            onOpen={() => doOpen(p)}
                            onFinder={() => doFinder(p)}
                            onDelete={() => setConfirm(p)}
                          />
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </>
          )}

          {/* ---------- Toast ---------- */}
          {toast && (
            <div
              className="cc-toast"
              style={{ borderColor: toast.tone === 'good' ? 'var(--good-line)' : 'var(--surface-3)' }}
            >
              <span style={{ color: toast.tone === 'good' ? 'var(--good)' : 'var(--text-3)', display: 'flex' }}>
                {toast.icon({ size: 15 })}
              </span>
              <span style={{ fontSize: 12.5, color: 'var(--text)', fontWeight: 550 }}>{toast.text}</span>
            </div>
          )}

          <div className="cc-divider" />
          {/* ---------- Footer ---------- */}
          {unlock ? (
            <div className="cc-footer" style={{ background: mixColor('rgba(255,99,99,0)', accent, 0.08), padding: 0 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <UnlockPrompt
                  accent={accent}
                  bytes={unlock.bytes}
                  activate={activateLicense}
                  onClose={() => setUnlock(null)}
                  needsReverify={license.needsReverify}
                />
              </div>
            </div>
          ) : confirm ? (
            <div className="cc-footer" style={{ background: mixColor('rgba(255,99,99,0)', accent, 0.1) }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 0 }}>
                <span style={{ color: accent, display: 'flex' }}>{UIIcon.trash({ size: 16 })}</span>
                <span
                  style={{
                    fontSize: 13,
                    color: 'var(--text)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  Delete <b>{confirm.name}</b>'s node_modules? Frees{' '}
                  <b style={{ color: '#fff' }}>{formatSizeStr(confirm.uniqueSize ?? confirm.size)}</b>
                  {confirm.uniqueSize !== undefined && confirm.size > confirm.uniqueSize ? (
                    <span style={{ color: 'var(--text-dim)' }}>
                      {' '}
                      ({formatSizeStr(confirm.size - confirm.uniqueSize)} linked stays in the pnpm store)
                    </span>
                  ) : (
                    '.'
                  )}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button className="cc-btn ghost" onClick={() => setConfirm(null)}>
                  Cancel <Kbd wide>esc</Kbd>
                </button>
                <button className="cc-btn danger" style={{ background: accent }} onClick={() => commitDelete(confirm)}>
                  Delete <Kbd wide>↵</Kbd>
                </button>
              </div>
            </div>
          ) : dockerConfirm ? (
            <div className="cc-footer" style={{ background: mixColor('rgba(255,99,99,0)', accent, 0.1) }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 0 }}>
                <span style={{ color: accent, display: 'flex' }}>{UIIcon.trash({ size: 16 })}</span>
                <span
                  style={{
                    fontSize: 13,
                    color: 'var(--text)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {dockerConfirm.kind === 'prune' ? 'Prune' : 'Remove'}{' '}
                  <b>
                    {dockerConfirm.kind === 'remove'
                      ? dockerConfirm.item.name
                      : PRUNE_TARGET_LABEL[dockerConfirm.target]}
                  </b>
                  ? Frees ~
                  <b style={{ color: '#fff' }}>
                    {formatSizeStr(
                      dockerConfirm.kind === 'remove' ? dockerConfirm.item.sizeBytes : dockerConfirm.estimatedBytes,
                    )}
                  </b>
                  . <span style={{ color: 'var(--text-dim)' }}>Permanent, not sent to the Trash.</span>
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {dockerNeedsTyped && (
                  <input
                    autoFocus
                    value={dockerTyped}
                    onChange={(e) => setDockerTyped(e.target.value)}
                    placeholder={`Type "${dockerRequiredText}"`}
                    spellCheck={false}
                    style={{
                      fontSize: 12.5,
                      padding: '5px 9px',
                      borderRadius: 7,
                      border: '1px solid var(--surface-4)',
                      background: 'var(--surface-1)',
                      color: 'var(--text)',
                      width: 150,
                      fontFamily: 'var(--ui-font)',
                    }}
                  />
                )}
                <button className="cc-btn ghost" onClick={closeDockerConfirm}>
                  Cancel <Kbd wide>esc</Kbd>
                </button>
                <button
                  className="cc-btn danger"
                  style={{ background: accent, opacity: dockerConfirmBlocked ? 0.5 : 1 }}
                  disabled={dockerConfirmBlocked}
                  onClick={commitDockerConfirm}
                >
                  {dockerConfirm.kind === 'prune' ? 'Prune' : 'Remove'} <Kbd wide>↵</Kbd>
                </button>
              </div>
            </div>
          ) : (
            <div className="cc-footer">
              <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <AppIcon accent={accent} size={20} />
                {view === 'list' &&
                  (showCalcSpinner ? (
                    <span
                      title={
                        scanning
                          ? 'Scanning your disk, the total is still updating.'
                          : 'Sizing the pnpm store, the total is still updating.'
                      }
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 7,
                        padding: '3px 9px 3px 7px',
                        borderRadius: 999,
                        background: 'var(--surface-2)',
                        boxShadow: 'inset 0 0 0 1px var(--hairline)',
                      }}
                    >
                      <Spinner size={10} color={accent} />
                      <span style={{ fontSize: 11.5, fontWeight: 650, color: 'var(--text-2)' }}>
                        {scanning ? 'scanning' : 'pnpm'}
                      </span>
                      <span style={{ fontSize: 11.5, fontWeight: 500, color: 'var(--text-dim)' }}>
                        {scanning
                          ? `${(scanProgress?.foldersChecked ?? 0).toLocaleString()} folders…`
                          : 'sizing store…'}
                      </span>
                    </span>
                  ) : (
                    showSummary && (
                      <span
                        style={{
                          fontSize: 12.5,
                          color: summaryOver ? mixColor('#fff', accent, 0.5) : 'var(--text-muted)',
                          fontWeight: 550,
                        }}
                      >
                        {summaryText}
                      </span>
                    )
                  ))}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                {view === 'list' && tab === 'projects' && !isEmpty && (
                  <div className="cc-hints">
                    <span>
                      {UIIcon.arrowUp({ size: 12 })}
                      {UIIcon.arrowDown({ size: 12 })} navigate
                    </span>
                    <span>
                      <Kbd>
                        <span style={{ display: 'flex' }}>{UIIcon.enter({ size: 12 })}</span>
                      </Kbd>{' '}
                      open
                    </span>
                    <span>
                      <Kbd wide>⌘</Kbd>
                      <Kbd wide>⌫</Kbd> delete
                    </span>
                  </div>
                )}
                {view === 'list' && tab === 'caches' && liveCaches.some((c) => !c.disabled) && (
                  <div className="cc-hints">
                    <span>
                      {UIIcon.arrowUp({ size: 12 })}
                      {UIIcon.arrowDown({ size: 12 })} navigate
                    </span>
                    <span>
                      <Kbd>
                        <span style={{ display: 'flex' }}>{UIIcon.enter({ size: 12 })}</span>
                      </Kbd>{' '}
                      {(liveCaches[sel]?.actionLabel ?? 'prune').toLowerCase()}
                    </span>
                  </div>
                )}
                {view === 'list' && tab === 'packages' && (inventory?.packages.length ?? 0) > 0 && (
                  <div className="cc-hints">
                    <span>
                      {UIIcon.arrowUp({ size: 12 })}
                      {UIIcon.arrowDown({ size: 12 })} navigate
                    </span>
                    <span>
                      <Kbd>
                        <span style={{ display: 'flex' }}>{UIIcon.enter({ size: 12 })}</span>
                      </Kbd>{' '}
                      details
                    </span>
                    <span>
                      <Kbd wide>⌘</Kbd>
                      <Kbd>
                        <span style={{ display: 'flex' }}>{UIIcon.enter({ size: 12 })}</span>
                      </Kbd>{' '}
                      npm
                    </span>
                  </div>
                )}
                <button className="cc-iconbtn" title="Rescan (⌘R)" onClick={rescan}>
                  {UIIcon.refresh({ size: 15 })}
                </button>
                <button
                  className="cc-iconbtn"
                  title="Settings (⌘,)"
                  onClick={() => setView(view === 'settings' ? 'list' : 'settings')}
                >
                  {UIIcon.gear({ size: 16 })}
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
