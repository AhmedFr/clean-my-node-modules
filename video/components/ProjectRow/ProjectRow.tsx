import type React from 'react'
import { interpolate } from 'remotion'
import { ACCENT, fmtSize, MONO_FONT, mixColor } from '../../theme.constants'
import { FrameworkMark } from '../FrameworkMark'
import { ROW_GAP, ROW_H } from './ProjectRow.constants'
import type { ProjectRowProps } from './ProjectRow.types'

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n))
}

const ICONS = {
  finder: 'M4 5a2 2 0 0 1 2-2h3.5l2 2H18a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z',
  chevron: 'm9 6 6 6-6 6',
}

function ActionButton({ d, danger }: { d: string; danger?: boolean }): React.ReactNode {
  return (
    <div
      style={{
        width: 30,
        height: 30,
        borderRadius: 8,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: danger ? 'rgba(255,99,99,0.16)' : 'rgba(255,255,255,0.08)',
        color: danger ? ACCENT : 'rgba(255,255,255,0.8)',
      }}
    >
      <svg
        width={16}
        height={16}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d={d} />
      </svg>
    </div>
  )
}

function TrashButton(): React.ReactNode {
  return (
    <div
      style={{
        width: 30,
        height: 30,
        borderRadius: 8,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(255,99,99,0.16)',
        color: ACCENT,
      }}
    >
      <svg
        width={16}
        height={16}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3 6h18" />
        <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
        <path d="M10 11v6M14 11v6" />
      </svg>
    </div>
  )
}

export function ProjectRow({ project, deleteProgress, selected, maxSizeGB }: ProjectRowProps): React.ReactNode {
  const swipe = clamp01(deleteProgress / 0.55)
  const collapse = clamp01((deleteProgress - 0.45) / 0.55)
  const stale = 0.85 // these are all old folders

  return (
    <div
      style={{
        height: ROW_H * (1 - collapse),
        marginBottom: ROW_GAP * (1 - collapse),
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'relative',
          height: ROW_H,
          display: 'flex',
          alignItems: 'center',
          gap: 13,
          padding: '0 16px',
          borderRadius: 12,
          background: selected ? 'rgba(255,255,255,0.085)' : 'transparent',
          boxShadow: selected ? 'inset 0 0 0 1px rgba(255,255,255,0.07)' : 'none',
          transform: `translateX(${swipe * 170}px) scale(${1 - swipe * 0.04})`,
          opacity: 1 - swipe,
        }}
      >
        <FrameworkMark framework={project.framework} size={40} />

        <div style={{ minWidth: 0, flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: 3 }}>
          <span style={{ fontWeight: 600, fontSize: 16, color: 'rgba(255,255,255,0.95)', whiteSpace: 'nowrap' }}>
            {project.name}
          </span>
          <span
            style={{
              fontSize: 12.5,
              color: 'rgba(255,255,255,0.38)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: '100%',
              fontFamily: MONO_FONT,
            }}
          >
            {project.path}/node_modules
          </span>
        </div>

        {selected ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <ActionButton d={ICONS.finder} />
            <ActionButton d={ICONS.chevron} />
            <TrashButton />
          </div>
        ) : (
          <>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                color: mixColor('rgba(150,154,162,0.9)', ACCENT, stale * 0.9),
                fontSize: 13,
                whiteSpace: 'nowrap',
              }}
            >
              <svg
                width={14}
                height={14}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.8}
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ opacity: 0.8 }}
              >
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3 2" />
              </svg>
              {project.age}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5, width: 96 }}>
              <span
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: 'rgba(255,255,255,0.95)',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {fmtSize(project.sizeGB)}
              </span>
              <div style={{ width: 88, height: 4, borderRadius: 3, background: 'rgba(255,255,255,0.08)' }}>
                <div
                  style={{
                    width: `${interpolate(project.sizeGB / maxSizeGB, [0, 1], [12, 88], { extrapolateRight: 'clamp' })}px`,
                    height: 4,
                    borderRadius: 3,
                    background: mixColor('#6b7180', ACCENT, stale),
                  }}
                />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
