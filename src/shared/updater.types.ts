/** What the renderer needs to describe one available update. */
export interface UpdateSummary {
  version: string
  /** ISO date string from the release feed; '' when the feed omits it. */
  releaseDate: string
  /** Size of the update zip in bytes; 0 when the feed omits it. */
  sizeBytes: number
  /** Plain-text release notes; null when the GitHub release body is empty. */
  notes: string | null
}

export type UpdaterErrorKind = 'network' | 'translocation' | 'unknown'

/** Full updater snapshot broadcast to renderers on every transition. */
export interface UpdaterState {
  currentVersion: string
  /** Epoch ms of the last completed check; null before the first one. */
  checkedAt: number | null
  status:
    | { phase: 'idle' }
    | { phase: 'checking' }
    | { phase: 'available'; info: UpdateSummary }
    | { phase: 'downloading'; info: UpdateSummary; percent: number }
    | { phase: 'downloaded'; info: UpdateSummary }
    | { phase: 'error'; message: string; kind: UpdaterErrorKind }
}
