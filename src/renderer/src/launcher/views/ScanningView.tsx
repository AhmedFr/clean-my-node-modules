import { PingBadge } from '@renderer/components/PingBadge'
import { UIIcon } from '@renderer/components/UIIcon'
import { useScanProgress } from '@renderer/hooks/useScanProgress'
import { type ReactNode, useEffect, useRef, useState } from 'react'

interface ScanningViewProps {
  accent: string
  onDone: () => void
}

/** Full-window scanning view; drives a real disk scan with live progress. */
export function ScanningView({ accent, onDone }: ScanningViewProps): ReactNode {
  const progress = useScanProgress()
  const [count, setCount] = useState(0)
  const [line, setLine] = useState('')
  const started = useRef(false)

  useEffect(() => {
    if (started.current) return
    started.current = true
    void window.clean.scan().then(() => setTimeout(onDone, 380))
  }, [onDone])

  useEffect(() => {
    if (!progress) return
    setCount(progress.foldersChecked)
    if (progress.currentPath) setLine(progress.currentPath)
  }, [progress])

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
      <PingBadge icon={UIIcon.search} tone="accent" accent={accent} size={84} iconSize={32} />
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 16, fontWeight: 650, color: 'var(--text-strong)' }}>Scanning your disk…</div>
        <div
          style={{
            fontSize: 12.5,
            color: 'var(--text-muted)',
            marginTop: 4,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {count.toLocaleString()} folders checked
        </div>
      </div>
      <div style={{ width: 300, height: 5, borderRadius: 3, background: 'var(--surface-2)', overflow: 'hidden' }}>
        <div
          style={{
            width: progress?.done ? '100%' : `${Math.min(95, count / 35)}%`,
            height: '100%',
            background: accent,
            borderRadius: 3,
            transition: 'width .3s ease',
          }}
        />
      </div>
      <div
        style={{
          fontFamily: 'var(--mono-font)',
          fontSize: 11.5,
          color: 'rgba(255,255,255,0.32)',
          maxWidth: 340,
          textAlign: 'center',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {line || '…'}
      </div>
    </div>
  )
}
