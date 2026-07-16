import { MItem } from '@renderer/components/MItem'
import { UIIcon } from '@renderer/components/UIIcon'
import { useAutoHeight } from '@renderer/hooks/useAutoHeight'
import { useSettings } from '@renderer/hooks/useSettings'
import { type ReactNode, useEffect, useRef, useState } from 'react'
import { DiskSummaryPlaceholder } from './DiskSummaryPlaceholder'
import type { PanelView } from './PanelApp.types'
import { PanelEmpty } from './PanelEmpty'
import { ScanPanel } from './ScanPanel'
import { Separator } from './Separator'

export function PanelApp(): ReactNode {
  const [settings, , settingsLoaded] = useSettings()
  const accent = settings.accent

  const [view, setView] = useState<PanelView>('main')
  const [lastScan, setLastScan] = useState(0)
  const rootRef = useRef<HTMLDivElement>(null)
  useAutoHeight(rootRef)

  useEffect(() => {
    void window.clean.getLastScanTime().then(setLastScan)
  }, [view])

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

  return (
    <div ref={rootRef} className="mb-panel">
      {view === 'scan' && <ScanPanel accent={accent} onDone={() => setView('main')} />}

      {view === 'main' && (
        <>
          {settingsLoaded && !settings.onboarded ? (
            <PanelEmpty accent={accent} onOpenSetup={() => void window.clean.openLauncher()} />
          ) : (
            <DiskSummaryPlaceholder />
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
