import { AppIcon } from '@renderer/components/AppIcon'
import { Gauge } from '@renderer/components/Gauge'
import { Kbd } from '@renderer/components/Kbd'
import { RescanHint } from '@renderer/components/RescanHint'
import { Row } from '@renderer/components/Row'
import { Segmented } from '@renderer/components/Segmented'
import { Spinner } from '@renderer/components/Spinner'
import { UIIcon } from '@renderer/components/UIIcon'
import { useAutoHeight } from '@renderer/hooks/useAutoHeight'
import { usePackages } from '@renderer/hooks/usePackages'
import { usePnpmStore } from '@renderer/hooks/usePnpmStore'
import { useProjects } from '@renderer/hooks/useProjects'
import { useScanProgress } from '@renderer/hooks/useScanProgress'
import { useSettings } from '@renderer/hooks/useSettings'
import { useToast } from '@renderer/hooks/useToast'
import { mixColor, statusColor } from '@renderer/lib/colors'
import { formatSizeStr, GB } from '@renderer/lib/format'
import type { PackageEntry } from '@shared/package.types'
import type { Project } from '@shared/project.types'
import { type ReactNode, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { CachesView } from '../views/CachesView'
import { EmptyView } from '../views/EmptyView'
import { Onboarding } from '../views/Onboarding'
import { PackagesView } from '../views/PackagesView'
import { ScanningView } from '../views/ScanningView'
import { SettingsView } from '../views/SettingsView'
import type { LauncherTab, LauncherToast, LauncherView, PackageSortKey, SortKey } from './LauncherApp.types'
import { SortTab } from './SortTab'

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
  const projects = useProjects()
  const accent = settings.accent
  const threshold = settings.thresholdGB * GB

  const [query, setQuery] = useState('')
  const [sortBy, setSortBy] = useState<SortKey>('used')
  const [pkgSortBy, setPkgSortBy] = useState<PackageSortKey>('used')
  const [expandedPkg, setExpandedPkg] = useState<string | null>(null)
  const [sel, setSel] = useState(0)
  const [view, setView] = useState<LauncherView>('list')
  const [tab, setTab] = useState<LauncherTab>('projects')
  const [deleting, setDeleting] = useState<Set<string>>(() => new Set())
  const [confirm, setConfirm] = useState<Project | null>(null)
  const [reclaimed, setReclaimed] = useState(0)
  const { toast, flashToast } = useToast<LauncherToast>()
  const { store, loading: storeLoading, pruning, prune, refresh } = usePnpmStore()
  const { inventory, computing: pkgComputing, ensure: ensurePackages, refresh: refreshPackages } = usePackages()
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

  // Packages tab: filter by name + sort by the active package sort key.
  const pkgFiltered = useMemo(() => {
    const all = inventory?.packages ?? []
    const q = query.trim().toLowerCase()
    const arr = all.filter((p) => !q || p.name.toLowerCase().includes(q))
    return [...arr].sort((a, b) => {
      if (pkgSortBy === 'size') return (b.size ?? 0) - (a.size ?? 0)
      if (pkgSortBy === 'name') return a.name.localeCompare(b.name)
      if (pkgSortBy === 'updates') {
        const score = (p: PackageEntry): number => (p.advisory ? 2 : 0) + (p.outdated ? 1 : 0)
        return score(b) - score(a) || b.projectCount - a.projectCount
      }
      return b.projectCount - a.projectCount // 'used'
    })
  }, [inventory, query, pkgSortBy])

  // Compute the inventory the first time the Packages tab is opened.
  useEffect(() => {
    if (view === 'list' && tab === 'packages') ensurePackages()
  }, [view, tab, ensurePackages])

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
      setConfirm(null)
      setDeleting((s) => new Set(s).add(p.id))
      void window.clean.deleteNodeModules(p.id).then((freed) => {
        setDeleting((s) => {
          const n = new Set(s)
          n.delete(p.id)
          return n
        })
        setReclaimed((r) => r + freed)
        flashToast({
          icon: UIIcon.checkCircle,
          text: `Reclaimed ${formatSizeStr(freed || (p.uniqueSize ?? p.size))} · ${p.name}`,
          tone: 'good',
        })
      })
    },
    [flashToast],
  )

  const rescan = useCallback(() => setView('scanning'), [])

  const handlePrune = useCallback(async () => {
    const res = await prune()
    if (res?.ok) {
      flashToast({
        icon: UIIcon.checkCircle,
        text: `Reclaimed ${formatSizeStr(res.freedBytes)} · pnpm store`,
        tone: 'good',
      })
    }
  }, [prune, flashToast])

  // keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      const meta = e.metaKey || e.ctrlKey
      if (meta && e.key === ',') {
        e.preventDefault()
        setView((v) => (v === 'settings' ? 'list' : 'settings'))
        setConfirm(null)
        return
      }
      if (meta && (e.key === 'r' || e.key === 'R')) {
        e.preventDefault()
        if (tab === 'packages') void refreshPackages()
        else rescan()
        return
      }
      if (meta && (e.key === '1' || e.key === '2' || e.key === '3')) {
        e.preventDefault()
        setTab(e.key === '1' ? 'projects' : e.key === '2' ? 'caches' : 'packages')
        setSel(0)
        setConfirm(null)
        setExpandedPkg(null)
        return
      }
      if (e.key === 'Escape') {
        if (confirm) {
          setConfirm(null)
          return
        }
        if (view === 'list' && tab === 'packages' && expandedPkg) {
          setExpandedPkg(null)
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
      if (view !== 'list') return
      if (tab === 'caches') {
        const cacheCount = store?.available ? 1 : 0
        if (e.key === 'ArrowDown') {
          e.preventDefault()
          setSel((s) => Math.min(cacheCount - 1, s + 1))
        } else if (e.key === 'ArrowUp') {
          e.preventDefault()
          setSel((s) => Math.max(0, s - 1))
        } else if (e.key === 'Enter') {
          e.preventDefault()
          if (store?.available && !pruning) void handlePrune()
        }
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
          else setExpandedPkg((prev) => (prev === p.name ? null : p.name))
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
    query,
    commitDelete,
    doOpen,
    rescan,
    store,
    pruning,
    handlePrune,
    pkgFiltered,
    openNpm,
    refreshPackages,
    expandedPkg,
  ])

  // The window is hidden (not destroyed) on blur/esc, so it keeps its React
  // state. Reset to a clean search every time it regains focus, like Spotlight.
  useEffect(() => {
    const onFocus = (): void => {
      setView('list')
      setTab('projects')
      setConfirm(null)
      setQuery('')
      setSel(0)
      setExpandedPkg(null)
      requestAnimationFrame(() => inputRef.current?.focus())
    }
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [])

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
  const overBy = totalUsed - threshold

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
                  setExpandedPkg(null)
                }}
                placeholder={
                  tab === 'projects'
                    ? 'Search node_modules by project or path…'
                    : tab === 'packages'
                      ? 'Search packages…'
                      : 'Search caches…'
                }
              />
              <Gauge
                used={totalUsed}
                threshold={threshold}
                accent={accent}
                linkedBytes={linkedTotal}
                calculating={calculating}
              />
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
                {view === 'settings' ? 'Settings' : 'Scanning'}
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
          {view === 'scanning' && <ScanningView accent={accent} onDone={() => setView('list')} />}
          {view === 'settings' && (
            <SettingsView
              settings={settings}
              setSetting={setSetting}
              accent={accent}
              store={store}
              onRefreshStore={() => void refresh()}
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
                    setExpandedPkg(null)
                  }}
                  options={[
                    { value: 'projects', label: 'Projects' },
                    { value: 'caches', label: 'Caches' },
                    { value: 'packages', label: 'Packages' },
                  ]}
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
                  onToggleExpand={(name) => setExpandedPkg((prev) => (prev === name ? null : name))}
                  onOpen={openNpm}
                  onRefresh={() => void refreshPackages()}
                />
              ) : tab === 'caches' ? (
                <CachesView
                  store={store}
                  pruning={pruning}
                  selectedIndex={sel}
                  query={query}
                  onSelectIndex={setSel}
                  onPrune={handlePrune}
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
          {confirm ? (
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
          ) : (
            <div className="cc-footer">
              <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <AppIcon accent={accent} size={20} />
                {view === 'list' &&
                  !isEmpty &&
                  (calculating ? (
                    <span
                      title={
                        scanning
                          ? 'Scanning your disk — the total is still updating.'
                          : 'Sizing the pnpm store — the total is still updating.'
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
                    <span
                      style={{
                        fontSize: 12.5,
                        color: ratio > 1 ? mixColor('#fff', accent, 0.5) : 'var(--text-muted)',
                        fontWeight: 550,
                      }}
                    >
                      {ratio > 1
                        ? `${formatSizeStr(overBy)} over your ${settings.thresholdGB} GB limit`
                        : `${(ratio * 100).toFixed(0)}% of your ${settings.thresholdGB} GB limit`}
                    </span>
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
                {view === 'list' && tab === 'caches' && store?.available && (
                  <div className="cc-hints">
                    <span>
                      {UIIcon.arrowUp({ size: 12 })}
                      {UIIcon.arrowDown({ size: 12 })} navigate
                    </span>
                    <span>
                      <Kbd>
                        <span style={{ display: 'flex' }}>{UIIcon.enter({ size: 12 })}</span>
                      </Kbd>{' '}
                      prune
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
