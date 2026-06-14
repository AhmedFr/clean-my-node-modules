export interface CaptionProps {
  text: string
  /** Total frames of the parent sequence (for the fade-out timing). */
  len: number
  /** Optional substring rendered in the accent color. */
  accentWord?: string
}
