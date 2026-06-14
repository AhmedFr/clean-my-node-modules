export interface PixelGaugeProps {
  usedGB: number
  limitGB: number
  /** Fixed track scale so cells drain in place instead of rescaling. */
  trackMaxGB?: number
  accent?: string
}
