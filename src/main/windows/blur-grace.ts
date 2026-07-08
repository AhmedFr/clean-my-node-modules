/** Grace window after a launcher show() during which a blur is ignored. */
export const BLUR_GRACE_MS = 500

/**
 * Whether a `blur` on the launcher window should dismiss (hide) it.
 *
 * A dock-hidden (LSUIElement) accessory app can't reliably make a freshly shown
 * window key, so macOS may deliver a spurious `blur` in the first moments after
 * show(). Dismissing on that blur hides the launcher the instant it opens (the
 * "full window won't open" bug). We therefore ignore blurs inside the grace
 * window, and never dismiss while the devtools are focused.
 */
export function blurShouldDismiss(
  elapsedSinceShownMs: number,
  devtoolsFocused: boolean,
  graceMs: number = BLUR_GRACE_MS,
): boolean {
  if (devtoolsFocused) return false
  return elapsedSinceShownMs >= graceMs
}
