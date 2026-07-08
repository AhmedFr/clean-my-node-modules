import { Toggle } from '@renderer/components/Toggle'
import type { VolumeOption } from '@shared/volume.types'
import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import type { ScanLocationsSettingsProps } from './ScanLocationsSettings.types'

function LocationRow({ label, detail, right }: { label: string; detail?: string; right: ReactNode }): ReactNode {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
        padding: '11px 4px',
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 13.5, fontWeight: 550, color: 'var(--text)' }}>{label}</div>
        {detail && (
          <div
            style={{
              fontSize: 11.5,
              color: 'var(--text-dim)',
              marginTop: 2,
              fontFamily: 'ui-monospace, monospace',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
            title={detail}
          >
            {detail}
          </div>
        )}
      </div>
      <div style={{ flex: '0 0 auto' }}>{right}</div>
    </div>
  )
}

function folderLabel(path: string): string {
  return path.split('/').filter(Boolean).pop() ?? path
}

/** Scan-location toggles: Home (always on), detected external volumes, and manually added folders. */
export function ScanLocationsSettings({ settings, accent, setSetting }: ScanLocationsSettingsProps): ReactNode {
  const [volumes, setVolumes] = useState<VolumeOption[]>([])

  useEffect(() => {
    let alive = true
    void window.clean.listVolumes().then((v) => {
      if (alive) setVolumes(v)
    })
    return () => {
      alive = false
    }
  }, [settings.scanRoots])

  const toggleVolume = (v: VolumeOption): void => {
    if (v.included) {
      void setSetting(
        'scanRoots',
        settings.scanRoots.filter((p) => p !== v.path),
      )
    } else {
      void setSetting('scanRoots', [...settings.scanRoots, v.path])
    }
  }

  const removeFolder = (path: string): void => {
    void setSetting(
      'scanRoots',
      settings.scanRoots.filter((p) => p !== path),
    )
  }

  const addFolder = async (): Promise<void> => {
    const picked = await window.clean.pickPath('folder')
    if (picked && !settings.scanRoots.includes(picked)) {
      void setSetting('scanRoots', [...settings.scanRoots, picked])
    }
  }

  const addedFolders = settings.scanRoots.filter((p) => !volumes.some((v) => v.path === p))

  return (
    <div>
      <LocationRow
        label="Home (~)"
        detail="Always scanned"
        right={
          <div style={{ opacity: 0.5, pointerEvents: 'none' }}>
            <Toggle on accent={accent} onToggle={() => {}} />
          </div>
        }
      />
      {volumes.map((v) => (
        <div key={v.path}>
          <div style={{ height: 1, background: 'var(--surface-1)' }} />
          <LocationRow
            label={v.name}
            detail={v.path}
            right={<Toggle on={v.included} accent={accent} onToggle={() => toggleVolume(v)} />}
          />
        </div>
      ))}
      {addedFolders.map((path) => (
        <div key={path}>
          <div style={{ height: 1, background: 'var(--surface-1)' }} />
          <LocationRow
            label={folderLabel(path)}
            detail={path}
            right={
              <button className="cc-btn ghost" onClick={() => removeFolder(path)}>
                Remove
              </button>
            }
          />
        </div>
      ))}
      <div style={{ height: 1, background: 'var(--surface-1)' }} />
      <div style={{ padding: '11px 4px 4px' }}>
        <button className="cc-btn ghost" onClick={() => void addFolder()}>
          Add folder…
        </button>
      </div>
    </div>
  )
}
