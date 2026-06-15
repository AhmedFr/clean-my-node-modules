import { DEFAULT_SETTINGS } from '@shared/settings.constants'
import type { Settings } from '@shared/settings.types'
import { useCallback, useEffect, useState } from 'react'

export type SetSetting = <K extends keyof Settings>(key: K, value: Settings[K]) => void

/** Live settings synced with the main process. */
export function useSettings(): [Settings, SetSetting] {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS)

  useEffect(() => {
    let alive = true
    window.clean.getSettings().then((s) => {
      if (alive) setSettings(s)
    })
    const unsubscribe = window.clean.onSettingsChanged(setSettings)
    return () => {
      alive = false
      unsubscribe()
    }
  }, [])

  const setSetting = useCallback<SetSetting>((key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
    void window.clean.setSetting(key, value)
  }, [])

  return [settings, setSetting]
}
