import type { ActivateResult } from '@shared/license.types'

export interface UnlockPromptProps {
  accent: string
  /** Bytes the blocked action would have freed — sharpens the pitch when known. */
  bytes?: number
  activate: (key: string) => Promise<ActivateResult>
  onClose: () => void
}
