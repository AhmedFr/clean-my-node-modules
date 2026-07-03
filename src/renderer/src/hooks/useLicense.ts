import type { ActivateResult, LicenseState } from '@shared/license.types'
import { useCallback, useEffect, useState } from 'react'

export interface UseLicense {
  license: LicenseState
  activate: (key: string) => Promise<ActivateResult>
}

/** Live license state synced with the main process across all windows. */
export function useLicense(): UseLicense {
  const [license, setLicense] = useState<LicenseState>({ pro: false })

  useEffect(() => {
    let alive = true
    window.clean.getLicense().then((s) => {
      if (alive) setLicense(s)
    })
    const unsubscribe = window.clean.onLicenseChanged(setLicense)
    return () => {
      alive = false
      unsubscribe()
    }
  }, [])

  const activate = useCallback(async (key: string) => {
    const result = await window.clean.activateLicense(key)
    if (result.ok) setLicense(result.state)
    return result
  }, [])

  return { license, activate }
}
