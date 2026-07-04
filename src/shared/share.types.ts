/** Untrusted renderer payload for the share card; main validates via coerceCardPayload. */
export interface ShareCardPayload {
  totalBytes: number
  nodeModulesBytes: number
  storeBytes: number
  projectsCount: number
  /** Where the copy was triggered from; analytics only. */
  source?: 'reveal' | 'header'
}
