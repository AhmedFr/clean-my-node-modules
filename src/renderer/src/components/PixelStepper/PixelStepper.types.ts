export interface PixelStepperProps {
  /** Current value in GB. */
  valueGB: number
  /** Accent color for filled blocks. */
  accent: string
  /** Called with the new whole-GB value when the user picks a block. */
  onChange: (gb: number) => void
}
