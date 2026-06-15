import { SCAN_INTERVAL_MS } from '@shared/settings.constants'
import type { ScanInterval } from '@shared/settings.types'

/** Re-runs the scan on the configured interval ('manual' disables it). */
export class ScanScheduler {
  private timer: NodeJS.Timeout | null = null

  constructor(private runScan: () => void) {}

  apply(interval: ScanInterval): void {
    this.stop()
    if (interval === 'manual') return
    this.timer = setInterval(() => this.runScan(), SCAN_INTERVAL_MS[interval])
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer)
    this.timer = null
  }
}
