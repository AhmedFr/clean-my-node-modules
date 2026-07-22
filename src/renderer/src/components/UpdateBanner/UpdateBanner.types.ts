export interface UpdateBannerProps {
  accent: string
  dismissedVersion?: string
  onDismiss: (version: string) => void
}
