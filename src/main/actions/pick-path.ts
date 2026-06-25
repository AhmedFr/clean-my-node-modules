import { dialog } from 'electron'

/** Opens a native open-dialog and returns the chosen path, or null if cancelled. */
export async function pickPath(mode: 'file' | 'folder'): Promise<string | null> {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: [mode === 'folder' ? 'openDirectory' : 'openFile'],
  })
  return canceled || filePaths.length === 0 ? null : filePaths[0]
}
