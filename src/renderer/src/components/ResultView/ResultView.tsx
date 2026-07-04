import { formatSizeStr } from '@renderer/lib/format'
import { type ReactNode, useEffect, useRef, useState } from 'react'
import type { ResultViewProps } from './ResultView.types'

const COUNT_UP_MS = 900

/** Cubic ease-out: quick start that settles gently into the final total. */
function easeOutCubic(t: number): number {
  return 1 - (1 - t) ** 3
}

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/** Post-scan damage reveal: count-up total, breakdown subline, share + continue actions. */
export function ResultView({
  accent,
  totalBytes,
  nodeModulesBytes,
  storeBytes,
  projectsCount,
  copied,
  onCopy,
  onContinue,
}: ResultViewProps): ReactNode {
  const [displayBytes, setDisplayBytes] = useState(() => (prefersReducedMotion() ? totalBytes : 0))
  const started = useRef(false)

  useEffect(() => {
    if (started.current) return
    started.current = true
    if (prefersReducedMotion()) {
      setDisplayBytes(totalBytes)
      return
    }
    const start = performance.now()
    let frame = requestAnimationFrame(function tick(now: number) {
      const t = Math.min(1, (now - start) / COUNT_UP_MS)
      setDisplayBytes(Math.round(totalBytes * easeOutCubic(t)))
      if (t < 1) frame = requestAnimationFrame(tick)
    })
    return () => cancelAnimationFrame(frame)
  }, [totalBytes])

  return (
    <div
      style={{
        padding: '46px 30px 50px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 22,
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 13, fontWeight: 650, color: 'var(--text-muted)' }}>Your damage report</div>
        <div
          style={{
            fontSize: 46,
            fontWeight: 750,
            color: 'var(--text-strong)',
            marginTop: 6,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {formatSizeStr(displayBytes)}
        </div>
        <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 8, maxWidth: 340, lineHeight: 1.5 }}>
          Found across {projectsCount} project{projectsCount === 1 ? '' : 's'} · {formatSizeStr(nodeModulesBytes)} in
          node_modules · {formatSizeStr(storeBytes)} in the pnpm store
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button className="cc-btn danger" style={{ background: accent }} onClick={onCopy}>
          {copied ? 'Copied. Paste anywhere' : 'Copy as image'}
        </button>
        <button className="cc-btn ghost" onClick={onContinue}>
          Continue
        </button>
      </div>
    </div>
  )
}
