import { GB } from '@shared/units.constants'
import { Notification } from 'electron'

/** Fires a native notification when usage crosses the threshold (once per crossing). */
export class ThresholdNotifier {
  private wasOver = false

  constructor(private onOpen: () => void) {}

  check(totalBytes: number, thresholdGB: number, enabled: boolean): void {
    const over = totalBytes > thresholdGB * GB
    if (over && !this.wasOver && enabled && Notification.isSupported()) {
      const usedGB = (totalBytes / GB).toFixed(2)
      const notification = new Notification({
        title: 'TidyDisk',
        body: `You've crossed your limit — ${usedGB} GB of stale dependencies are taking up space.`,
      })
      notification.on('click', () => this.onOpen())
      notification.show()
    }
    this.wasOver = over
  }
}
