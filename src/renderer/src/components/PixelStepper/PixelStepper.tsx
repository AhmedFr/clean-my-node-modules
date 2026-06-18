import { mixColor } from '@renderer/lib/colors'
import { type ReactNode, useRef } from 'react'
import { STEPPER_CELLS, gbToIndex, indexToGb, nudgeGb } from './PixelStepper.constants'
import type { PixelStepperProps } from './PixelStepper.types'

/** Pixel-rectangle stepper for the alert threshold — each block is one GB step. */
export function PixelStepper({ valueGB, accent, onChange }: PixelStepperProps): ReactNode {
  const rowRef = useRef<HTMLDivElement>(null)
  const selIdx = gbToIndex(valueGB)

  const setFromClientX = (clientX: number): void => {
    const el = rowRef.current
    if (!el) return
    const { left, width } = el.getBoundingClientRect()
    const idx = Math.min(STEPPER_CELLS - 1, Math.max(0, Math.floor(((clientX - left) / width) * STEPPER_CELLS)))
    const gb = indexToGb(idx)
    if (gb !== valueGB) onChange(gb)
  }

  return (
    <div
      ref={rowRef}
      role="slider"
      tabIndex={0}
      aria-label="Alert threshold in gigabytes"
      aria-valuemin={1}
      aria-valuemax={10}
      aria-valuenow={indexToGb(selIdx)}
      onPointerDown={(e) => {
        ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
        setFromClientX(e.clientX)
      }}
      onPointerMove={(e) => {
        if (e.buttons === 1) setFromClientX(e.clientX)
      }}
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
          e.preventDefault()
          onChange(nudgeGb(valueGB, 1))
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
          e.preventDefault()
          onChange(nudgeGb(valueGB, -1))
        }
      }}
      style={{ display: 'flex', gap: 2, cursor: 'pointer', outline: 'none', touchAction: 'none' }}
    >
      {Array.from({ length: STEPPER_CELLS }).map((_, i) => {
        const filled = i <= selIdx
        const selected = i === selIdx
        return (
          <div
            key={i}
            style={{
              flex: 1,
              height: 18,
              borderRadius: 2.5,
              background: filled ? accent : 'var(--surface-2)',
              filter: selected ? 'brightness(1.3)' : 'none',
              boxShadow: selected ? `0 0 8px ${mixColor(accent, 'rgba(0,0,0,0)', 0.5)}` : 'none',
              transition: 'background .12s, filter .12s',
            }}
          />
        )
      })}
    </div>
  )
}
