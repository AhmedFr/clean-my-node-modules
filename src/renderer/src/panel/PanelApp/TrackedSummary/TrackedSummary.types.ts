export interface TrackedSummaryProps {
  /** Every tracked byte, counted once. */
  heroBytes: number
  combinedLimitGB: number
  trackMaxGB: number
  /** Number of size areas present, for the "across N areas" line. */
  areaCount: number
  accent: string
}
