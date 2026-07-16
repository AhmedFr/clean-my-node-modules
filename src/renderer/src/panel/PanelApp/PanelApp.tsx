import { MItem } from '@renderer/components/MItem'
import { UIIcon } from '@renderer/components/UIIcon'
import { useAutoHeight } from '@renderer/hooks/useAutoHeight'
import { useDocker } from '@renderer/hooks/useDocker'
import { usePackages } from '@renderer/hooks/usePackages'
import { usePnpmStore } from '@renderer/hooks/usePnpmStore'
import { useProjects } from '@renderer/hooks/useProjects'
import { useSettings } from '@renderer/hooks/useSettings'
import { DOCKER_STALE_MS } from '@renderer/lib/staleness'
import type { LauncherNavTarget } from '@shared/launcher-nav.types'
import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AreaBar } from './AreaBar'
import type { PanelView } from './PanelApp.types'
import { PanelEmpty } from './PanelEmpty'
import { panelAreas } from './panelAreas'
import { ScanPanel } from './ScanPanel'
import { Separator } from './Separator'
import { TrackedSummary } from './TrackedSummary'

export function PanelApp(): ReactNode {
  const [settings, , settingsLoaded] = useSettings()
  const accent = settings.accent

  const projects = useProjects()
  const { store, refresh: refreshStore } = usePnpmStore()
  const docker = useDocker()
  const { inventory } = usePackages()
  const dockerEnabled = settings.docker !== false

  const areas = useMemo(
    () =>
      panelAreas({
        projects,
        store,
        docker: docker.info,
        dockerEnabled,
        inventory,
        checkUpdates: settings.checkUpdates,
        thresholdGB: settings.thresholdGB,
        cacheThresholdGB: settings.cacheThresholdGB,
        dockerThresholdGB: settings.dockerThresholdGB,
      }),
    [
      projects,
      store,
      docker.info,
      dockerEnabled,
      inventory,
      settings.checkUpdates,
      settings.thresholdGB,
      settings.cacheThresholdGB,
      settings.dockerThresholdGB,
    ],
  )

  const [view, setView] = useState<PanelView>('main')
  const [lastScan, setLastScan] = useState(0)
  const rootRef = useRef<HTMLDivElement>(null)
  useAutoHeight(rootRef)

  useEffect(() => {
    void window.clean.getLastScanTime().then(setLastScan)
  }, [view])

  // Docker's cache never expires on its own, so re-probe it when the panel opens on
  // missing or stale data. Guarded on `loading` and a freshened `checkedAt` so it
  // cannot loop; the last-known numbers render instantly meanwhile.
  useEffect(() => {
    if (view !== 'main' || !dockerEnabled || docker.loading) return
    const stale = !docker.info || Date.now() - docker.info.checkedAt > DOCKER_STALE_MS
    if (stale) void docker.refresh()
  }, [view, dockerEnabled, docker.info, docker.loading, docker.refresh])

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
        void window.clean.openLauncher('settings')
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

  const openArea = useCallback((nav: LauncherNavTarget): void => {
    void window.clean.openLauncher(nav)
  }, [])

  return (
    <div ref={rootRef} className="mb-panel">
      {view === 'scan' && (
        <ScanPanel
          accent={accent}
          onDone={() => {
            setView('main')
            void refreshStore()
          }}
        />
      )}

      {view === 'main' && (
        <>
          {settingsLoaded &&
            (!settings.onboarded ? (
              <PanelEmpty accent={accent} onOpenSetup={() => void window.clean.openLauncher()} />
            ) : (
              <>
                <TrackedSummary
                  heroBytes={areas.heroBytes}
                  combinedLimitGB={areas.combinedLimitGB}
                  trackMaxGB={areas.trackMaxGB}
                  areaCount={areas.areaCount}
                  accent={accent}
                />
                <Separator />
                <div style={{ padding: '4px 0 5px' }}>
                  {areas.rows.map((row) => (
                    <AreaBar key={row.id} row={row} accent={accent} onOpen={() => openArea(row.nav)} />
                  ))}
                </div>
              </>
            ))}
          <Separator />
          <div style={{ paddingBottom: 5 }}>
            <MItem
              icon={UIIcon.search}
              label="Open full window…"
              shortcut="⌘O"
              onClick={() => void window.clean.openLauncher()}
            />
            <MItem icon={UIIcon.refresh} label="Scan now" shortcut="⌘R" onClick={() => setView('scan')} />
            <MItem
              icon={UIIcon.gear}
              label="Settings…"
              shortcut="⌘,"
              onClick={() => void window.clean.openLauncher('settings')}
            />
            <MItem icon={UIIcon.power} label="Quit" shortcut="⌘Q" onClick={() => window.clean.quitApp()} />
          </div>
          <Separator />
          <div style={{ padding: '1px 16px 9px', fontSize: 11, color: 'var(--text-dim)' }}>
            Last scan {lastScanLabel} · next in {nextScanLabel}
          </div>
        </>
      )}
    </div>
  )
}
