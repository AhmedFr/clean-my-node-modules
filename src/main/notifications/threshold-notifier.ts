import { Notification } from 'electron'

const GB = 1024 * 1024 * 1024

/** Fires a native notification when usage crosses the threshold (once per crossing). */
export class ThresholdNotifier {
  private wasOver = false

  constructor(private onOpen: () => void) {}

  check(totalBytes: number, thresholdGB: number, enabled: boolean): void {
    const over = totalBytes > thresholdGB * GB
    if (over && !this.wasOver && enabled && Notification.isSupported()) {
      const usedGB = (totalBytes / GB).toFixed(2)
      const notification = new Notification({
        title: 'Clean my node_modules',
        body: `You've crossed your limit — ${usedGB} GB of stale dependencies are taking up space.`,
      })
      notification.on('click', () => this.onOpen())
      notification.show()
    }
    this.wasOver = over
  }
}
