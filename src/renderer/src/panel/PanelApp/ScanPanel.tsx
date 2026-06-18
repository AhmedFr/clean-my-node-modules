import { PingBadge } from '@renderer/components/PingBadge'
import { UIIcon } from '@renderer/components/UIIcon'
import { useScanProgress } from '@renderer/hooks/useScanProgress'
import { type ReactNode, useEffect, useRef, useState } from 'react'

interface ScanPanelProps {
  accent: string
  onDone: () => void
}

/** Compact scanning view inside the dropdown; drives a real disk scan. */
export function ScanPanel({ accent, onDone }: ScanPanelProps): ReactNode {
  const progress = useScanProgress()
  const [count, setCount] = useState(0)
  const started = useRef(false)

  useEffect(() => {
    if (started.current) return
    started.current = true
    void window.clean.scan().then(() => setTimeout(onDone, 350))
  }, [onDone])

  useEffect(() => {
    if (progress) setCount(progress.foldersChecked)
  }, [progress])

  return (
    <div
      style={{
        padding: '34px 24px 38px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 16,
      }}
    >
      <PingBadge icon={UIIcon.search} tone="accent" accent={accent} size={56} iconSize={24} />
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 14.5, fontWeight: 650, color: '#fff' }}>Scanning your disk…</div>
        <div
          style={{
            fontSize: 12,
            color: 'var(--text-muted)',
            marginTop: 3,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {count.toLocaleString()} folders checked
        </div>
      </div>
      <div style={{ width: 230, height: 5, borderRadius: 3, background: 'var(--border)', overflow: 'hidden' }}>
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
    </div>
  )
}
