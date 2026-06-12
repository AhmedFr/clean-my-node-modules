import { useEffect, useState } from 'react'
import type { ScanProgress } from '@shared/project.types'

/** Subscribes to live scan progress events from the main process. */
export function useScanProgress(): ScanProgress | null {
  const [progress, setProgress] = useState<ScanProgress | null>(null)
  useEffect(() => window.clean.onScanProgress(setProgress), [])
  return progress
}
