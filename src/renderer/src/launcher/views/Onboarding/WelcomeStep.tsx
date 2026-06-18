import { AppIcon } from '@renderer/components/AppIcon'
import { UIIcon } from '@renderer/components/UIIcon'
import type { ReactNode } from 'react'

interface WelcomeStepProps {
  accent: string
  onNext: () => void
  onSkip: () => void
}

function Dots({ active }: { active: 0 | 1 }): ReactNode {
  return (
    <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 18 }}>
      {[0, 1].map((i) => (
        <span
          key={i}
          style={{
            width: 20,
            height: 5,
            borderRadius: 3,
            background: i === active ? 'var(--text-3)' : 'var(--surface-2)',
          }}
        />
      ))}
    </div>
  )
}

function Reassure({ children }: { children: ReactNode }): ReactNode {
  return (
    <div
      style={{
        display: 'flex',
        gap: 9,
        alignItems: 'flex-start',
        color: 'var(--text-2)',
        fontSize: 12.5,
        margin: '7px 0',
      }}
    >
      <span style={{ color: 'var(--good)', display: 'flex', flex: 'none', marginTop: 1 }}>
        {UIIcon.checkCircle({ size: 15 })}
      </span>
      <span>{children}</span>
    </div>
  )
}

/** Onboarding step 1: brand, value prop, reassurance, primary CTA. */
export function WelcomeStep({ accent, onNext, onSkip }: WelcomeStepProps): ReactNode {
  return (
    <div
      style={{
        padding: '34px 40px 30px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
      }}
    >
      <Dots active={0} />
      <AppIcon accent={accent} size={40} />
      <div style={{ fontSize: 19, fontWeight: 700, marginTop: 14, color: 'var(--text-strong)' }}>
        Clean my <span style={{ fontFamily: 'var(--mono-font)', color: 'var(--good)' }}>node_modules</span>
      </div>
      <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6, maxWidth: 380 }}>
        Find and reclaim disk from heavy, stale dependency folders.
      </div>
      <div
        style={{
          background: 'var(--surface-1)',
          border: '1px solid var(--hairline)',
          borderRadius: 11,
          padding: '11px 14px',
          marginTop: 18,
          textAlign: 'left',
          maxWidth: 420,
          width: '100%',
        }}
      >
        <Reassure>Scans your home folder — skips system &amp; hidden files</Reassure>
        <Reassure>
          Deletes to Trash, never <code style={{ fontFamily: 'var(--mono-font)', color: 'var(--text-3)' }}>rm -rf</code>{' '}
          — fully reversible
        </Reassure>
      </div>
      <button
        type="button"
        onClick={onNext}
        style={{
          marginTop: 20,
          width: '100%',
          maxWidth: 420,
          background: accent,
          color: '#fff',
          border: 'none',
          borderRadius: 10,
          padding: '11px',
          fontSize: 13.5,
          fontWeight: 650,
          cursor: 'pointer',
        }}
      >
        Get started →
      </button>
      <button
        type="button"
        onClick={onSkip}
        style={{
          marginTop: 10,
          background: 'none',
          border: 'none',
          color: 'var(--text-faint)',
          fontSize: 12,
          cursor: 'pointer',
        }}
      >
        Skip — use defaults
      </button>
    </div>
  )
}
