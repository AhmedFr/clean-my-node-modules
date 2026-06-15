import type React from 'react'
import type { RowState } from '../components/LauncherWindow'
import { LauncherWindow } from '../components/LauncherWindow'
import { ReclaimBadge } from '../components/ReclaimBadge'
import type { MockProject } from '../mockData'
import { LIMIT_GB, PROJECTS, TOTAL_USED_GB } from '../mockData'
import { ACCENT, SAFE, UI_FONT } from '../theme.constants'
import { ScreenFrame } from './ScreenFrame'

const MAX_SIZE = Math.max(...PROJECTS.map((p) => p.sizeGB))

const toRows = (projects: MockProject[], selectedId?: string): RowState[] =>
  projects.map((p) => ({ project: p, deleteProgress: 0, selected: p.id === selectedId }))

/** 1 — branding / hero: the full launcher, gauge deep in the red. */
export function ScreenBeauty(): React.ReactNode {
  return (
    <ScreenFrame
      eyebrow="macOS menu-bar app"
      headline="Clean my node_modules"
      accentWord="node_modules"
      sub="Find every stale node_modules folder and reclaim the disk — without leaving your menu bar."
      glow={ACCENT}
      scale={1.18}
    >
      <LauncherWindow
        usedGB={TOTAL_USED_GB}
        limitGB={LIMIT_GB}
        trackMaxGB={TOTAL_USED_GB * 1.05}
        rows={toRows(PROJECTS)}
        maxSizeGB={MAX_SIZE}
        folderCount={61}
      />
    </ScreenFrame>
  )
}

const CLEANED: MockProject[] = [
  { id: 'cli', name: 'cli', path: '~/code/acme/packages/cli', framework: 'ts', sizeGB: 0.9, age: '2 weeks ago' },
  {
    id: 'scripts',
    name: 'scripts',
    path: '~/code/acme/tools/scripts',
    framework: 'node',
    sizeGB: 0.4,
    age: '5 days ago',
  },
  {
    id: 'shared',
    name: 'shared',
    path: '~/code/acme/packages/shared',
    framework: 'ts',
    sizeGB: 0.2,
    age: '3 days ago',
  },
]

/** 2 — the payoff: gauge swung green, "Reclaimed 23 GB". */
export function ScreenClean(): React.ReactNode {
  return (
    <ScreenFrame
      eyebrow="Reclaimed in seconds"
      headline="One click. Gigabytes back."
      accentWord="Gigabytes"
      sub="Delete the bloat and the meter sweeps from over-limit back into the green."
      glow={SAFE}
      scale={1.18}
      overlay={
        <div style={{ position: 'absolute', bottom: 28, left: '50%', transform: 'translateX(-50%)' }}>
          <ReclaimBadge gb={23.0} appear={1} />
        </div>
      }
    >
      <LauncherWindow
        usedGB={3.32}
        limitGB={LIMIT_GB}
        trackMaxGB={TOTAL_USED_GB * 1.05}
        rows={toRows(CLEANED)}
        maxSizeGB={1}
        folderCount={56}
      />
    </ScreenFrame>
  )
}

function SafeChip(): React.ReactNode {
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 30,
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 12,
        padding: '13px 22px',
        borderRadius: 14,
        background: 'rgba(20,20,23,0.92)',
        border: '1px solid rgba(255,255,255,0.12)',
        fontFamily: UI_FONT,
        fontSize: 22,
        fontWeight: 600,
        color: 'rgba(255,255,255,0.9)',
        boxShadow: '0 16px 40px rgba(0,0,0,0.5)',
      }}
    >
      <svg
        width={24}
        height={24}
        viewBox="0 0 24 24"
        fill="none"
        stroke={ACCENT}
        strokeWidth={1.9}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3 6h18" />
        <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
      </svg>
      Moved to the Trash — never{' '}
      <span style={{ fontFamily: 'ui-monospace, Menlo, monospace', color: '#fff' }}>rm&nbsp;-rf</span>, always
      recoverable
    </div>
  )
}

/** 3 — trust: a row primed to delete, with the safety promise. */
export function ScreenSafe(): React.ReactNode {
  return (
    <ScreenFrame
      eyebrow="Safe by design"
      headline="Delete with zero anxiety"
      accentWord="zero anxiety"
      sub="Folders go to the Trash, so a mistaken click is one ⌘Z away."
      glow={ACCENT}
      scale={1.18}
      overlay={<SafeChip />}
    >
      <LauncherWindow
        usedGB={TOTAL_USED_GB}
        limitGB={LIMIT_GB}
        trackMaxGB={TOTAL_USED_GB * 1.05}
        rows={toRows(PROJECTS, 'web')}
        maxSizeGB={MAX_SIZE}
        folderCount={61}
      />
    </ScreenFrame>
  )
}
