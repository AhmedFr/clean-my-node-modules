import { useEffect, useRef, useState, type ReactNode } from 'react'
import { UIIcon } from '@renderer/components/UIIcon'
import { useScanProgress } from '@renderer/hooks/useScanProgress'

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
      <div style={{ position: 'relative', width: 56, height: 56 }}>
        <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.1)' }} />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            border: '2px solid transparent',
            borderTopColor: accent,
            animation: 'mbspin .8s linear infinite',
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: accent,
          }}
        >
          {UIIcon.search({ size: 22, stroke: 1.9 })}
        </div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 14.5, fontWeight: 650, color: '#fff' }}>Scanning your disk…</div>
        <div
          style={{
            fontSize: 12,
            color: 'rgba(255,255,255,0.45)',
            marginTop: 3,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {count.toLocaleString()} folders checked
        </div>
      </div>
      <div style={{ width: 230, height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
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
