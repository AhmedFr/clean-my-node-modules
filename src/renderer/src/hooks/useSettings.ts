import { DEFAULT_SETTINGS } from '@shared/settings.constants'
import type { Settings } from '@shared/settings.types'
import { useCallback, useEffect, useState } from 'react'

export type SetSetting = <K extends keyof Settings>(key: K, value: Settings[K]) => Promise<Settings>

/** Live settings synced with the main process; `loaded` is false until the first fetch resolves. */
export function useSettings(): [Settings, SetSetting, boolean] {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let alive = true
    window.clean.getSettings().then((s) => {
      if (alive) {
        setSettings(s)
        setLoaded(true)
      }
    })
    const unsubscribe = window.clean.onSettingsChanged(setSettings)
    return () => {
      alive = false
      unsubscribe()
    }
  }, [])

  const setSetting = useCallback<SetSetting>((key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
    return window.clean.setSetting(key, value)
  }, [])

  return [settings, setSetting, loaded]
}
