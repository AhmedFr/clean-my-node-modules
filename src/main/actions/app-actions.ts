import { rm } from 'node:fs/promises'
import { app, dialog, shell } from 'electron'

/** Resolves the running `.app` bundle path, or null when unpackaged (dev). */
function appBundlePath(): string | null {
  if (!app.isPackaged) return null
  const exe = app.getPath('exe') // …/TidyDisk.app/Contents/MacOS/<exe>
  const idx = exe.indexOf('.app/')
  if (idx === -1) return null
  return exe.slice(0, idx + 4) // include the trailing '.app'
}

/**
 * Uninstalls the app after a native confirmation: moves the `.app` bundle to the
 * Trash, wipes its preferences/cache, then quits. A running macOS app can trash
 * its own bundle (the process stays in memory), so this is safe to call live.
 */
export async function uninstallApp(): Promise<void> {
  const { response } = await dialog.showMessageBox({
    type: 'warning',
    buttons: ['Move to Trash', 'Cancel'],
    defaultId: 1,
    cancelId: 1,
    message: 'Uninstall TidyDisk?',
    detail:
      'The app and all its preferences will be moved to the Trash. Your projects and their node_modules are not touched.',
  })
  if (response !== 0) return

  // Move the app bundle to the Trash (skipped in dev, where there is no bundle).
  const bundle = appBundlePath()
  if (bundle) await shell.trashItem(bundle).catch(() => {})

  // Remove app data: settings.json, projects-cache.json, etc.
  await rm(app.getPath('userData'), { recursive: true, force: true }).catch(() => {})

  app.quit()
}
