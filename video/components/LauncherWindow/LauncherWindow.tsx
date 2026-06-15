import type React from 'react'
import { ACCENT, HAIRLINE, mixColor, PANEL, UI_FONT } from '../../theme.constants'
import { AppTile } from '../AppTile'
import { PixelGauge } from '../PixelGauge'
import { ProjectRow } from '../ProjectRow'
import type { LauncherWindowProps } from './LauncherWindow.types'
import { LAUNCHER_WIDTH } from './LauncherWindow.types'

function SortTab({ label, active }: { label: string; active?: boolean }): React.ReactNode {
  return (
    <span
      style={{
        fontSize: 12,
        fontWeight: 600,
        padding: '4px 9px',
        borderRadius: 7,
        color: active ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.4)',
        background: active ? 'rgba(255,255,255,0.1)' : 'transparent',
      }}
    >
      {label}
    </span>
  )
}

export function LauncherWindow({
  usedGB,
  limitGB,
  trackMaxGB,
  rows,
  maxSizeGB,
  folderCount,
}: LauncherWindowProps): React.ReactNode {
  const over = usedGB > limitGB
  const ratio = usedGB / limitGB
  const footerText = over
    ? `${(usedGB - limitGB).toFixed(1)} GB over your ${limitGB} GB limit`
    : `${Math.round(ratio * 100)}% of your ${limitGB} GB limit`

  return (
    <div
      style={{
        width: LAUNCHER_WIDTH,
        fontFamily: UI_FONT,
        background: PANEL,
        borderRadius: 18,
        overflow: 'hidden',
        boxShadow: `inset 0 0 0 1px rgba(255,255,255,0.08), 0 40px 90px -20px rgba(0,0,0,0.7)${
          over ? `, 0 0 70px -8px ${mixColor(ACCENT, 'rgba(0,0,0,0)', 0.5)}` : ''
        }`,
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '15px 18px' }}>
        <AppTile size={30} />
        <div style={{ flex: 1, minWidth: 0, fontSize: 18, fontWeight: 450, color: 'rgba(255,255,255,0.34)' }}>
          Search node_modules by project or path…
        </div>
        <PixelGauge usedGB={usedGB} limitGB={limitGB} trackMaxGB={trackMaxGB} />
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            background: 'rgba(255,255,255,0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'rgba(255,255,255,0.7)',
          }}
        >
          <svg
            width={14}
            height={14}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
          >
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </div>
      </div>
      <div style={{ height: 1, background: HAIRLINE }} />

      {/* List head */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 20px 7px' }}>
        <span
          style={{
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.36)',
          }}
        >
          {folderCount} folders · reclaimable
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginRight: 5 }}>Sort</span>
          <SortTab label="Last used" active />
          <SortTab label="Size" />
          <SortTab label="Name" />
        </div>
      </div>

      {/* List */}
      <div style={{ padding: '4px 8px 8px' }}>
        {rows.map((r) => (
          <ProjectRow
            key={r.project.id}
            project={r.project}
            deleteProgress={r.deleteProgress}
            selected={r.selected}
            maxSizeGB={maxSizeGB}
          />
        ))}
      </div>

      <div style={{ height: 1, background: HAIRLINE }} />
      {/* Footer */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '11px 16px',
          minHeight: 50,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <AppTile size={20} />
          <span
            style={{
              fontSize: 13.5,
              fontWeight: 550,
              color: over ? mixColor('#fff', ACCENT, 0.5) : mixColor('#fff', '#34d399', 0.45),
            }}
          >
            {footerText}
          </span>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            color: 'rgba(255,255,255,0.4)',
            fontSize: 12,
            fontWeight: 500,
          }}
        >
          <span>↑↓ navigate</span>
          <span>↵ open</span>
          <span>⌘⌫ delete</span>
        </div>
      </div>
    </div>
  )
}
