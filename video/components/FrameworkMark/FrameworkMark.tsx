import React from 'react'
import type { Framework } from '../../mockData'
import type { FrameworkMarkProps } from './FrameworkMark.types'

interface Spec {
  bg: string
  fg: string
  mark: (c: string) => React.ReactNode
}

/** Simplified framework marks, ported from src/renderer .../FrameworkIcon. */
const SPECS: Record<Framework, Spec> = {
  react: {
    bg: '#0b3a47',
    fg: '#61dafb',
    mark: (c) => (
      <g stroke={c} strokeWidth="1.4" fill="none">
        <ellipse cx="12" cy="12" rx="9" ry="3.6" />
        <ellipse cx="12" cy="12" rx="9" ry="3.6" transform="rotate(60 12 12)" />
        <ellipse cx="12" cy="12" rx="9" ry="3.6" transform="rotate(120 12 12)" />
        <circle cx="12" cy="12" r="1.6" fill={c} stroke="none" />
      </g>
    ),
  },
  next: {
    bg: '#000000',
    fg: '#ffffff',
    mark: (c) => (
      <g>
        <path d="M7 7v10M7 7l9 11" stroke={c} strokeWidth="1.7" fill="none" strokeLinecap="round" />
        <path d="M16 7v6.5" stroke={c} strokeWidth="1.7" strokeLinecap="round" />
      </g>
    ),
  },
  vue: {
    bg: '#14231d',
    fg: '#42b883',
    mark: (c) => (
      <path d="M4 6h3.2L12 14l4.8-8H20l-8 13.5z" stroke={c} strokeWidth="1.5" fill="none" strokeLinejoin="round" />
    ),
  },
  svelte: {
    bg: '#3a1a0e',
    fg: '#ff5d2b',
    mark: (c) => (
      <path
        d="M14.5 7.5c-2-1.3-4.7-.8-6 1.1-1.4 1.9-.9 4.3.6 5.4-.2.4-.3.9-.3 1.4 0 1.7 1.5 3.1 3.6 3.1 1 0 2-.4 2.8-1.1l2-1.7c2-1.3 2.4-3.7 1-5.6"
        stroke={c}
        strokeWidth="1.4"
        fill="none"
        strokeLinejoin="round"
      />
    ),
  },
  node: {
    bg: '#13270f',
    fg: '#7fc241',
    mark: (c) => (
      <g stroke={c} strokeWidth="1.4" fill="none">
        <path d="M12 3.5 20 8v8L12 20.5 4 16V8z" strokeLinejoin="round" />
        <path d="M12 16c-2 0-3-1-3-2.4 0-.8.6-1.3 1.5-1.3 1 0 1.4.5 1.4 1.6 0 1 .8 1.6 2.1 1.6 1.2 0 1.9-.5 1.9-1.2 0-.8-.5-1.1-2.2-1.4-2-.3-3.2-.8-3.2-2.3 0-1.4 1.2-2.2 3.1-2.2 1.8 0 3 .7 3.1 2.2" />
      </g>
    ),
  },
  ts: {
    bg: '#13294a',
    fg: '#3b82f6',
    mark: (c) => (
      <text x="12" y="16.5" textAnchor="middle" fontSize="11" fontWeight="800" fill={c} fontFamily="system-ui">
        TS
      </text>
    ),
  },
}

export function FrameworkMark({ framework, size = 40 }: FrameworkMarkProps): React.ReactNode {
  const spec = SPECS[framework]
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.26,
        flex: '0 0 auto',
        background: spec.bg,
        boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <svg width={size * 0.66} height={size * 0.66} viewBox="0 0 24 24">
        {spec.mark(spec.fg)}
      </svg>
    </div>
  )
}
