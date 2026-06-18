import { MItem } from '@renderer/components/MItem'
import { MiniRow } from '@renderer/components/MiniRow'
import { UIIcon } from '@renderer/components/UIIcon'
import { useAutoHeight } from '@renderer/hooks/useAutoHeight'
import { usePnpmStore } from '@renderer/hooks/usePnpmStore'
import { useProjects } from '@renderer/hooks/useProjects'
import { useSettings } from '@renderer/hooks/useSettings'
import { useToast } from '@renderer/hooks/useToast'
import { DAY, formatSizeStr, GB } from '@renderer/lib/format'
import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { CleanStaleCta } from './CleanStaleCta'
import { DiskSummary } from './DiskSummary'
import { STALE_DAYS, VISIBLE_ROWS } from './PanelApp.constants'
import type { PanelToast, PanelView } from './PanelApp.types'
import { PanelEmpty } from './PanelEmpty'
import { PanelSettings } from './PanelSettings'
import { PnpmStoreRow } from './PnpmStoreRow'
import { ScanPanel } from './ScanPanel'
import { Separator } from './Separator'

export function PanelApp(): ReactNode {
  const [settings, setSetting, settingsLoaded] = useSettings()
  const projects = useProjects()
  const accent = settings.accent
  const threshold = settings.thresholdGB * GB

  const [view, setView] = useState<PanelView>('main')
  const [deleting, setDeleting] = useState<Set<string>>(() => new Set())
  const [reclaimed, setReclaimed] = useState(0)
  const [lastScan, setLastScan] = useState(0)
  const { toast, flashToast } = useToast<PanelToast>()
  const rootRef = useRef<HTMLDivElement>(null)
  useAutoHeight(rootRef)

  useEffect(() => {
    void window.clean.getLastScanTime().then(setLastScan)
  }, [view, projects])

  const totalUsed = useMemo(() => projects.reduce((a, p) => a + p.size, 0), [projects])
  const usedGB = totalUsed / GB

  // high-water mark keeps the meter scale stable while deleting (no render-time
  // mutation: account for current usage now, persist the peak via state)
  const [maxSeenGB, setMaxSeenGB] = useState(usedGB)
  useEffect(() => setMaxSeenGB((m) => Math.max(m, usedGB)), [usedGB])
  const trackMaxGB = Math.max(settings.thresholdGB * 1.5, Math.max(maxSeenGB, usedGB) * 1.06)

  const oldest = useMemo(() => [...projects].sort((a, b) => a.lastUsed - b.lastUsed), [projects])
  const visible = oldest.slice(0, VISIBLE_ROWS)
  const staleSet = useMemo(() => projects.filter((p) => (Date.now() - p.lastUsed) / DAY > STALE_DAYS), [projects])
  const freeable = staleSet.reduce((a, p) => a + p.size, 0)

  const removeMany = useCallback(
    async (ids: string[], label?: string) => {
      setDeleting((s) => new Set([...s, ...ids]))
      let freed = 0
      for (const id of ids) freed += await window.clean.deleteNodeModules(id)
      setDeleting((s) => {
        const n = new Set(s)
        for (const i of ids) n.delete(i)
        return n
      })
      setReclaimed((r) => r + freed)
      flashToast({ text: `Reclaimed ${formatSizeStr(freed)}${label ? ` · ${label}` : ''}`, good: true })
    },
    [flashToast],
  )

  const { store, pruning, prune } = usePnpmStore()
  const pruneStore = useCallback(async () => {
    const result = await prune()
    if (result?.ok) {
      setReclaimed((r) => r + result.freedBytes)
      flashToast({ text: `Reclaimed ${formatSizeStr(result.freedBytes)} · pnpm store`, good: true })
    } else if (result) {
      flashToast({ text: 'pnpm store prune failed' })
    }
  }, [prune, flashToast])

  const cleanStale = useCallback(() => {
    if (staleSet.length) {
      void removeMany(
        staleSet.map((p) => p.id),
        `${staleSet.length} stale folders`,
      )
    }
  }, [staleSet, removeMany])

  // keyboard shortcuts: ⌘O full window, ⌘R scan, ⌘, settings, esc close
  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      const meta = e.metaKey || e.ctrlKey
      if (meta && (e.key === 'o' || e.key === 'O')) {
        e.preventDefault()
        void window.clean.openLauncher()
      } else if (meta && (e.key === 'q' || e.key === 'Q')) {
        e.preventDefault()
        window.clean.quitApp()
      } else if (meta && (e.key === 'r' || e.key === 'R')) {
        e.preventDefault()
        setView('scan')
      } else if (meta && e.key === ',') {
        e.preventDefault()
        setView((v) => (v === 'settings' ? 'main' : 'settings'))
      } else if (e.key === 'Escape') {
        if (view !== 'main') setView('main')
        else void window.clean.closeWindow()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [view])

  const nextScanLabel =
    settings.scanInterval === '6h'
      ? '6 h'
      : settings.scanInterval === 'daily'
        ? '18 h'
        : settings.scanInterval === 'weekly'
          ? '5 d'
          : '—'
  const lastScanLabel = lastScan ? `${Math.max(1, Math.round((Date.now() - lastScan) / 60000))} min ago` : 'never'

  return (
    <div ref={rootRef} className="mb-panel">
      {view === 'scan' && <ScanPanel accent={accent} onDone={() => setView('main')} />}

      {view === 'settings' && (
        <>
          <div className="mb-phead">
            <button className="mb-back" onClick={() => setView('main')} aria-label="Back">
              {UIIcon.chevronLeft({ size: 17 })}
            </button>
            <span style={{ fontSize: 13.5, fontWeight: 650, color: '#fff' }}>Settings</span>
          </div>
          <Separator />
          <PanelSettings settings={settings} setSetting={setSetting} accent={accent} />
        </>
      )}

      {view === 'main' && (
        <>
          <DiskSummary
            totalUsed={totalUsed}
            threshold={threshold}
            thresholdGB={settings.thresholdGB}
            usedGB={usedGB}
            trackMaxGB={trackMaxGB}
            accent={accent}
          />
          <Separator />
          {projects.length === 0 ? (
            settingsLoaded ? (
              <PanelEmpty
                onboarded={settings.onboarded}
                reclaimed={reclaimed}
                accent={accent}
                onOpenSetup={() => void window.clean.openLauncher()}
              />
            ) : null
          ) : (
            <>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0 15px 4px',
                }}
              >
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '.05em',
                    color: 'var(--text-dim)',
                  }}
                >
                  Reclaimable · oldest first
                </span>
                <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>{projects.length} total</span>
              </div>
              {visible.map((p) => (
                <MiniRow
                  key={p.id}
                  p={p}
                  accent={accent}
                  deleting={deleting.has(p.id)}
                  onDelete={() => void removeMany([p.id], p.name)}
                  onReveal={() => {
                    void window.clean.revealInFinder(p.id)
                    flashToast({ text: `Revealing ${p.name} in Finder…` })
                  }}
                />
              ))}
              {staleSet.length > 0 ? (
                <CleanStaleCta
                  accent={accent}
                  sub={`Frees ${formatSizeStr(freeable)} · keeps your active projects`}
                  onClick={cleanStale}
                >
                  Clean {staleSet.length} stale folders
                </CleanStaleCta>
              ) : (
                <div style={{ height: 8 }} />
              )}
            </>
          )}
          {store?.available && (
            <>
              <Separator />
              <PnpmStoreRow store={store} pruning={pruning} onPrune={() => void pruneStore()} />
            </>
          )}
          <Separator />
          <div style={{ paddingBottom: 5 }}>
            <MItem
              icon={UIIcon.search}
              label="Open full window…"
              shortcut="⌘O"
              onClick={() => void window.clean.openLauncher()}
            />
            <MItem icon={UIIcon.refresh} label="Scan now" shortcut="⌘R" onClick={() => setView('scan')} />
            <MItem icon={UIIcon.gear} label="Settings…" shortcut="⌘," onClick={() => setView('settings')} />
            <MItem icon={UIIcon.power} label="Quit" shortcut="⌘Q" onClick={() => window.clean.quitApp()} />
          </div>
          <Separator />
          <div style={{ padding: '1px 16px 9px', fontSize: 11, color: 'var(--text-dim)' }}>
            Last scan {lastScanLabel} · next in {nextScanLabel}
          </div>
        </>
      )}

      {toast && (
        <div className="mb-toast" style={{ borderColor: toast.good ? 'var(--good-line)' : 'var(--surface-4)' }}>
          <span style={{ color: toast.good ? 'var(--good)' : 'var(--text-3)', display: 'flex' }}>
            {(toast.good ? UIIcon.checkCircle : UIIcon.finder)({ size: 15 })}
          </span>
          <span style={{ fontSize: 12.5, color: '#fff', fontWeight: 550 }}>{toast.text}</span>
        </div>
      )}
    </div>
  )
}
