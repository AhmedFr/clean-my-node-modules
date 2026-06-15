import type { FrameworkKind } from '@shared/project.types'
import type { FrameworkSpec } from './FrameworkIcon.types'

/** Original simplified framework marks drawn in a rounded square (from the design). */
export const FRAMEWORKS: Record<FrameworkKind, FrameworkSpec> = {
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
      <path
        d="M4 6h3.2L12 14l4.8-8H20l-8 13.5z M8.5 6H12l0 0 3.5 0"
        stroke={c}
        strokeWidth="1.5"
        fill="none"
        strokeLinejoin="round"
      />
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
  astro: {
    bg: '#1a1020',
    fg: '#ff5d01',
    mark: (c) => (
      <g fill={c}>
        <path d="M12 3 8 19l4-2.2L16 19z" opacity="0.95" />
        <ellipse cx="12" cy="16.5" rx="3.6" ry="1.2" fill="none" stroke={c} strokeWidth="1.2" />
      </g>
    ),
  },
  ts: {
    bg: '#13294a',
    fg: '#3b82f6',
    mark: (c) => (
      <text
        x="12"
        y="16.5"
        fontSize="11"
        fontWeight="800"
        fill={c}
        textAnchor="middle"
        fontFamily="ui-monospace, monospace"
      >
        TS
      </text>
    ),
  },
  vite: {
    bg: '#241a3a',
    fg: '#bd34fe',
    mark: (c) => <path d="M5 6 12 20 19 6 12 9z" stroke={c} strokeWidth="1.4" fill="none" strokeLinejoin="round" />,
  },
  remix: {
    bg: '#20242b',
    fg: '#9ca3af',
    mark: (c) => (
      <path
        d="M6 6h7c2 0 3 1 3 2.6 0 1.6-1 2.4-2.6 2.5 1.6.1 2.6.8 2.6 2.7V18M6 11h6.5"
        stroke={c}
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
      />
    ),
  },
  expo: {
    bg: '#0b1020',
    fg: '#e2e8f0',
    mark: (c) => (
      <path
        d="M12 5 5 18M12 5l7 13M9 13h6"
        stroke={c}
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  },
}
