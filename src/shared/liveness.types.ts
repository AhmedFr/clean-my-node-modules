/** A running process associated with a live project (tooltip detail). */
export interface LiveInfo {
  pid: number
  command: string
  /** Best-effort listening TCP port, tooltip only. */
  port?: number
}
