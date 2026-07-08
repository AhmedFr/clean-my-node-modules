import type { DeleteResult } from '@shared/delete.types'
import type { LiveInfo } from '@shared/liveness.types'

type Detect = (dirs: string[]) => Promise<Map<string, LiveInfo>>

/** Pre-delete guard: live result if the project dir is running, else null. */
export async function liveGuard(absPath: string, detect: Detect): Promise<DeleteResult | null> {
  const live = await detect([absPath])
  return live.has(absPath) ? { freed: 0, blocked: 'live' } : null
}
